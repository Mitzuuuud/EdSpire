"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { BookSessionModal } from "@/components/book-session-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Video } from "lucide-react"
import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: "easeOut",
    },
  },
}

const popVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      duration: 0.3,
    },
  },
}

// Mock data for scheduled sessions
const scheduledSessions = [
  {
    id: "1",
    title: "Advanced Calculus",
    tutor: "Dr. Sarah Chen",
    time: "3:00 PM - 4:00 PM",
    date: "Today",
    subject: "Mathematics",
    type: "video",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Quantum Physics",
    tutor: "Dr. Mike Johnson",
    time: "10:00 AM - 11:00 AM",
    date: "Tomorrow",
    subject: "Physics",
    type: "video",
    status: "scheduled",
  },
  {
    id: "3",
    title: "Organic Chemistry",
    tutor: "Prof. Emily Davis",
    time: "2:00 PM - 3:00 PM",
    date: "Friday",
    subject: "Chemistry",
    type: "video",
    status: "scheduled",
  },
]

const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"]

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const fullWeekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

interface BookedSession {
  id: string
  tutor: string
  subject: string
  date: string
  time: string
  dayIndex: number
  timeIndex: number
  actualDate?: Date
}

export default function SchedulePage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"week" | "day" | "month">("week")
  const [currentWeek, setCurrentWeek] = useState(0)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{ dayIndex: number; timeIndex: number } | null>(null)

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      // 6 weeks * 7 days
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const getSessionsForDate = (date: Date) => {
    return bookedSessions.filter((session) => {
      if (session.actualDate) {
        return session.actualDate.toDateString() === date.toDateString()
      }
      return false
    })
  }

  const handleSessionBooked = (sessionData: {
    tutor: string
    subject: string
    date: string
    time: string
  }) => {
    if (selectedSlot) {
      const newSession: BookedSession = {
        id: Date.now().toString(),
        tutor: sessionData.tutor,
        subject: sessionData.subject,
        date: sessionData.date,
        time: sessionData.time,
        dayIndex: selectedSlot.dayIndex,
        timeIndex: selectedSlot.timeIndex,
        actualDate: new Date(sessionData.date),
      }
      setBookedSessions((prev) => [...prev, newSession])
      setSelectedSlot(null)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.main className="container px-6 py-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-6 w-6 text-primary" />
                <h1 className="font-display text-3xl font-bold text-foreground">Schedule</h1>
              </div>
              <p className="text-muted-foreground">Manage your tutoring sessions</p>
            </div>
            <Button onClick={() => setIsBookingModalOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Book Session</span>
            </Button>
          </div>
        </motion.div>

        {/* Calendar Controls */}
        <motion.div className="mb-6 flex items-center justify-between" variants={itemVariants}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (viewMode === "month") {
                    navigateMonth("prev")
                  } else {
                    setCurrentWeek(currentWeek - 1)
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center">
                {viewMode === "month"
                  ? currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : currentWeek === 0
                    ? "This Week"
                    : currentWeek === 1
                      ? "Next Week"
                      : `Week ${currentWeek + 1}`}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (viewMode === "month") {
                    navigateMonth("next")
                  } else {
                    setCurrentWeek(currentWeek + 1)
                  }
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Select value={viewMode} onValueChange={(value: "week" | "day" | "month") => setViewMode(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="day">Day View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (viewMode === "month") {
                setCurrentMonth(new Date())
              } else {
                setCurrentWeek(0)
              }
            }}
          >
            Today
          </Button>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Grid */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  {viewMode === "week" ? "Weekly Schedule" : viewMode === "day" ? "Daily Schedule" : "Monthly Schedule"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {viewMode === "month" ? (
                  <div className="space-y-4">
                    {/* Month Header */}
                    <div className="grid grid-cols-7 gap-2 text-sm font-medium text-muted-foreground">
                      {fullWeekDays.map((day) => (
                        <div key={day} className="text-center p-2">
                          {day.slice(0, 3)}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                      {generateCalendarDays(currentMonth).map((date, index) => {
                        const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                        const isToday = date.toDateString() === new Date().toDateString()
                        const sessionsForDate = getSessionsForDate(date)

                        return (
                          <motion.div
                            key={index}
                            className={`min-h-[80px] p-2 border border-border/50 rounded-lg cursor-pointer transition-colors ${
                              isCurrentMonth ? "hover:bg-muted/50" : "bg-muted/20 text-muted-foreground"
                            } ${isToday ? "bg-primary/10 border-primary/30" : ""}`}
                            variants={popVariants}
                            onClick={() => {
                              if (isCurrentMonth) {
                                setIsBookingModalOpen(true)
                              }
                            }}
                          >
                            <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                              {date.getDate()}
                            </div>
                            {sessionsForDate.map((session, sessionIndex) => (
                              <div key={sessionIndex} className="text-xs mb-1 p-1 bg-primary/10 rounded truncate">
                                <div className="font-medium text-primary">{session.subject}</div>
                                <div className="text-muted-foreground">{session.time}</div>
                              </div>
                            ))}
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ) : viewMode === "week" ? (
                  <div className="space-y-4">
                    {/* Week Header */}
                    <div className="grid grid-cols-8 gap-2 text-sm font-medium text-muted-foreground">
                      <div className="text-right pr-2">Time</div>
                      {weekDays.map((day) => (
                        <div key={day} className="text-center">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-2">
                      {timeSlots.map((time, timeIndex) => (
                        <motion.div key={time} className="grid grid-cols-8 gap-2 min-h-[60px]" variants={popVariants}>
                          <div className="text-sm text-muted-foreground text-right pr-2 py-2">{time}</div>
                          {weekDays.map((day, dayIndex) => {
                            const hasStaticSession =
                              (timeIndex === 6 && dayIndex === 2) || (timeIndex === 2 && dayIndex === 3)

                            const dynamicSession = bookedSessions.find(
                              (session) => session.dayIndex === dayIndex && session.timeIndex === timeIndex,
                            )

                            const hasSession = hasStaticSession || dynamicSession

                            return (
                              <div
                                key={`${day}-${time}`}
                                className={`border border-border/50 rounded-lg p-2 hover:bg-muted/50 transition-colors cursor-pointer ${
                                  hasSession ? "bg-primary/10 border-primary/30" : ""
                                }`}
                                onClick={() => {
                                  if (!hasSession) {
                                    setSelectedSlot({ dayIndex, timeIndex })
                                    setIsBookingModalOpen(true)
                                  }
                                }}
                              >
                                {hasStaticSession && (
                                  <motion.div
                                    className="text-xs"
                                    variants={popVariants}
                                    initial="hidden"
                                    animate="visible"
                                  >
                                    <div className="font-medium text-primary">Calculus</div>
                                    <div className="text-muted-foreground">Dr. Chen</div>
                                  </motion.div>
                                )}
                                {dynamicSession && (
                                  <motion.div
                                    className="text-xs"
                                    variants={popVariants}
                                    initial="hidden"
                                    animate="visible"
                                  >
                                    <div className="font-medium text-primary">{dynamicSession.subject}</div>
                                    <div className="text-muted-foreground">{dynamicSession.tutor}</div>
                                  </motion.div>
                                )}
                              </div>
                            )
                          })}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="flex items-center space-x-4 p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setIsBookingModalOpen(true)}
                      >
                        <div className="text-sm font-medium w-20">{time}</div>
                        <div className="flex-1 text-sm text-muted-foreground">Available</div>
                        <Button variant="ghost" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Sessions */}
          <motion.div className="space-y-6" variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scheduledSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    className="p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                    variants={itemVariants}
                    custom={index}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <p className="text-sm text-muted-foreground">{session.tutor}</p>
                      </div>
                      <Badge variant={session.status === "upcoming" ? "default" : "secondary"}>
                        {session.status === "upcoming" ? "Starting Soon" : "Scheduled"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{session.date}</span>
                      </div>
                    </div>
                    {session.status === "upcoming" && (
                      <Button size="sm" className="w-full mt-3">
                        <Video className="h-4 w-4 mr-2" />
                        Join Session
                      </Button>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-medium">5 sessions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Hours</span>
                  <span className="font-medium">7.5h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Next Session</span>
                  <span className="font-medium text-primary">In 2h</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.main>

      <BookSessionModal
        open={isBookingModalOpen}
        onOpenChange={setIsBookingModalOpen}
        onSessionBooked={handleSessionBooked}
      />
    </div>
  )
}
