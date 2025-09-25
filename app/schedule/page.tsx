"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { AddEventModal } from "@/components/add-event-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Video, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { getUserSessions } from "@/lib/session-booking"
import type { BookedSession as DatabaseBookedSession } from "@/lib/session-booking"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.22, staggerChildren: 0.05 } as const,
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1.0] } as const,
  },
} as const

const popVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 } as const,
  },
}

// Generate 24-hour time slots (00:00 to 23:00)
const timeSlots = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`)

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const fullWeekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const getWeekOfMonthLabel = (weekOffset: number) => {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() + weekOffset * 7)
  const month = startOfWeek.toLocaleDateString("en-US", { month: "long" })
  const year = startOfWeek.getFullYear()
  const firstDayOfMonth = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), 1)
  const dayOfMonth = startOfWeek.getDate()
  const weekNumber = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7)
  return `${month} ${year} – Week ${weekNumber}`
}

const getStartOfWeek = (offset = 0) => {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((day + 6) % 7) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const getWeekDates = (offset = 0) => {
  const start = getStartOfWeek(offset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

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

interface CustomEvent {
  id: string
  title: string
  type: string
  date: string
  startTime: string
  endTime: string
  description?: string
  location?: string
  priority: string
  dayIndex?: number
  timeIndex?: number
  actualDate?: Date
}

export default function SchedulePage() {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [currentWeek, setCurrentWeek] = useState(0)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([])
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([])
  const [databaseSessions, setDatabaseSessions] = useState<DatabaseBookedSession[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{ dayIndex: number; timeIndex: number; date?: string; time?: string } | null>(null)
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)

  function generateCalendarDays(monthDate: Date): Date[] {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth  = new Date(year, month + 1, 0)

    // Start on the Sunday of the week that contains the first day
    const startDate = new Date(firstDayOfMonth)
    startDate.setDate(firstDayOfMonth.getDate() - startDate.getDay())

    const days: Date[] = []
    let current = new Date(startDate)

    // keep going until we’ve covered the last week that contains the month’s last day
    while (current <= lastDayOfMonth || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }


  const loadUserSessions = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const sessions = await getUserSessions(currentUser.uid)
      setDatabaseSessions(sessions)
    } catch (error) {
      console.error("Error loading sessions for calendar:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
        setLoading(false)
      }
    } catch (e) {
      console.error("Failed to load user for schedule:", e)
      setCurrentUser(null)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUser) loadUserSessions()
  }, [currentUser])

  // Auto-scroll only in WEEK view
  useEffect(() => {
    if (viewMode === "week") {
      const currentHour = new Date().getHours()
      const scrollTarget = Math.max(0, currentHour - 2)
      setTimeout(() => {
        const scrollContainer = document.querySelector(".schedule-scroll-container") as HTMLElement | null
        if (scrollContainer) {
          const timeSlotHeight = 68
          scrollContainer.scrollTop = scrollTarget * timeSlotHeight
        }
      }, 100)
    }
  }, [viewMode])

  const getEventsForDate = (date: Date) => {
    // Combine custom events, manual booked sessions, and database sessions
    const customEventsForDate = customEvents.filter((event) => {
      if (event.actualDate) {
        return event.actualDate.toDateString() === date.toDateString()
      }
      return false
    }).map((event) => ({
      id: event.id,
      title: event.title,
      subject: event.title,
      type: event.type,
      priority: event.priority,
      time: `${event.startTime} - ${event.endTime}`,
      location: event.location,
      description: event.description,
      isCustomEvent: true
    }))

    const manualSessions = bookedSessions.filter((session) => {
      if (session.actualDate) {
        return session.actualDate.toDateString() === date.toDateString()
      }
      return false
    }).map((session) => ({
      id: session.id,
      title: session.subject,
      subject: session.subject,
      type: 'tutoring',
      time: session.time,
      tutor: session.tutor,
      isCustomEvent: false
    }))

    const dbSessions = databaseSessions.filter((session) => {
      const sessionDate = new Date(session.startTime)
      return sessionDate.toDateString() === date.toDateString()
    }).map((session) => ({
      id: session.id || 'unknown',
      title: session.subject,
      subject: session.subject,
      type: 'tutoring',
      tutor: session.tutorName,
      time: `${session.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${session.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      isCustomEvent: false
    }))

    return [...customEventsForDate, ...manualSessions, ...dbSessions]
  }

  const getEventForTimeSlot = (dayIndex: number, timeIndex: number) => {
    // Check custom events first
    const weekDates = getWeekDates(currentWeek)
    const targetDate = weekDates[dayIndex]
    const targetHour = parseInt(timeSlots[timeIndex].split(":")[0])

    const customEvent = customEvents.find((event) => {
      if (!event.actualDate) return false
      const eventStartHour = parseInt(event.startTime.split(':')[0])
      
      return event.actualDate.toDateString() === targetDate.toDateString() && 
             eventStartHour === targetHour
    })

    if (customEvent) {
      return {
        id: customEvent.id,
        title: customEvent.title,
        subject: customEvent.title,
        type: customEvent.type,
        priority: customEvent.priority,
        location: customEvent.location,
        isCustomEvent: true
      }
    }

    // Check manual booked sessions
    const manualSession = bookedSessions.find(
      (session) => session.dayIndex === dayIndex && session.timeIndex === timeIndex
    )
    if (manualSession) {
      return {
        ...manualSession,
        title: manualSession.subject,
        isCustomEvent: false
      }
    }

    // Check database sessions
    const dbSession = databaseSessions.find((session) => {
      const sessionDate = new Date(session.startTime)
      return sessionDate.toDateString() === targetDate.toDateString() && sessionDate.getHours() === targetHour
    })

    if (dbSession) {
      return {
        id: dbSession.id || "unknown",
        title: dbSession.subject,
        tutor: dbSession.tutorName,
        subject: dbSession.subject,
        type: 'tutoring',
        isCustomEvent: false
      }
    }
    return null
  }

  const handleEventAdded = (eventData: {
    title: string
    type: string
    date: string
    startTime: string
    endTime: string
    description?: string
    location?: string
    priority: string
  }) => {
    const newEvent: CustomEvent = {
      id: Date.now().toString(),
      ...eventData,
      actualDate: new Date(eventData.date),
      dayIndex: selectedSlot?.dayIndex || -1,
      timeIndex: selectedSlot?.timeIndex || -1,
    }
    
    setCustomEvents((prev) => [...prev, newEvent])
    setSelectedSlot(null)
    
    // Save to localStorage for persistence
    const existingEvents = JSON.parse(localStorage.getItem('customEvents') || '[]')
    localStorage.setItem('customEvents', JSON.stringify([...existingEvents, newEvent]))
  }

  // Load custom events from localStorage on component mount
  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem('customEvents')
      if (savedEvents) {
        const events = JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          actualDate: new Date(event.date)
        }))
        setCustomEvents(events)
      }
    } catch (error) {
      console.error('Failed to load custom events:', error)
    }
  }, [])

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + (direction === "prev" ? -1 : 1))
      return newDate
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.main className="mx-auto w-full max-w-7xl px-6 py-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-6 w-6 text-primary" />
                <h1 className="font-display text-3xl font-bold text-foreground">Schedule</h1>
              </div>
              <p className="text-muted-foreground">Manage your tutoring sessions and study sessions</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={loadUserSessions}
                disabled={loading || !currentUser}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              <Button onClick={() => setIsEventModalOpen(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Event</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Calendar Controls */}
        <motion.div className="mb-6 flex items-center justify-between" variants={itemVariants}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => (viewMode === "month" ? navigateMonth("prev") : setCurrentWeek(currentWeek - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[160px] text-center">
                {viewMode === "month"
                  ? currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                  : getWeekOfMonthLabel(currentWeek)}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => (viewMode === "month" ? navigateMonth("next") : setCurrentWeek(currentWeek + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Select value={viewMode} onValueChange={(value: "week" | "month") => setViewMode(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            {viewMode === "week" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentHour = new Date().getHours()
                  const scrollTarget = Math.max(0, currentHour - 2)
                  const scrollContainer = document.querySelector(".schedule-scroll-container") as HTMLElement | null
                  if (scrollContainer) {
                    const timeSlotHeight = 68
                    scrollContainer.scrollTo({ top: scrollTarget * timeSlotHeight, behavior: "smooth" })
                  }
                }}
                className="text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                Now ({new Date().getHours().toString().padStart(2, "0")}:00)
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (viewMode === "month") setCurrentMonth(new Date())
                else setCurrentWeek(0)
              }}
            >
              Today
            </Button>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar Grid */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{viewMode === "week" ? "Weekly Schedule" : "Monthly Schedule"}</CardTitle>
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
                        const eventsForDate = getEventsForDate(date)
                        const hasEvents = eventsForDate.length > 0

                        return (
                          <motion.div
                            key={index}
                            className={[
                              "min-h-[90px] p-2 border rounded-lg cursor-pointer transition-colors relative",
                              isCurrentMonth
                                ? hasEvents
                                  // fill the whole cell if there are events
                                  ? "bg-primary/10 border-primary/30 hover:bg-primary/15"
                                  : "hover:bg-muted/50 border-border/50"
                                : "bg-muted/20 text-muted-foreground border-border/40",
                              isToday ? "ring-2 ring-primary/50" : "",
                            ].join(" ")}
                            variants={popVariants}
                            onClick={() => {
                              if (isCurrentMonth) {
                                setSelectedSlot({ 
                                  dayIndex: -1, 
                                  timeIndex: -1, 
                                  date: date.toISOString().split('T')[0] 
                                })
                                setIsEventModalOpen(true)
                              }
                            }}
                          >
                            <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                              {date.getDate()}
                            </div>

                            {/* Events list — no pill bg; let the cell carry the color */}
                            <div className="space-y-1">
                              {eventsForDate.map((event: any, eventIndex: number) => (
                                <div key={eventIndex} className="text-xs leading-snug truncate">
                                  <div className="font-medium text-primary">{event.subject || event.title}</div>
                                  <div className="text-muted-foreground">{event.time}</div>
                                </div>
                              ))}
                            </div>
                            {hasEvents && (
                              <div className="absolute top-2 right-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                  {eventsForDate.length}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Week Header */}
                    <div className="grid grid-cols-8 gap-2 text-sm font-medium text-muted-foreground">
                      <div className="text-right pr-2">Time</div>
                      {getWeekDates(currentWeek).map((date) => (
                        <div key={date.toDateString()} className="text-center">
                          <div className="text-sm font-medium">{date.getDate()}</div>
                          <div className="text-xs text-muted-foreground">
                            {date.toLocaleDateString("en-US", { weekday: "short" })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Time Slots with Scroll */}
                    <div className="schedule-scroll-container max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                      <div className="space-y-2 pr-2">
                        {timeSlots.map((time, timeIndex) => {
                          const currentHour = new Date().getHours()
                          const isCurrentHour = timeIndex === currentHour
                          return (
                          <motion.div 
                            key={time} 
                            className={`grid grid-cols-8 gap-2 min-h-[60px] ${isCurrentHour ? 'bg-primary/5 rounded-lg' : ''}`} 
                            variants={popVariants}
                          >
                            <div className={`text-sm text-right pr-2 py-2 sticky left-0 bg-background/95 backdrop-blur ${
                              isCurrentHour ? 'text-primary font-medium' : 'text-muted-foreground'
                            }`}>
                              {time}
                              {isCurrentHour && <div className="text-xs text-primary">Now</div>}
                            </div>
                            {weekDays.map((day, dayIndex) => {
                              const eventInSlot = getEventForTimeSlot(dayIndex, timeIndex)
                              const hasEvent = eventInSlot !== null

                              return (
                                <div
                                  key={`${day}-${time}`}
                                  className={`border border-border/50 rounded-lg p-2 hover:bg-muted/50 transition-colors cursor-pointer ${
                                    hasEvent ? "bg-primary/10 border-primary/30" : ""
                                  }`}
                                  onClick={() => {
                                    if (!hasEvent) {
                                      const weekDates = getWeekDates(currentWeek)
                                      const selectedDate = weekDates[dayIndex]
                                      const selectedTime = timeSlots[timeIndex]
                                      setSelectedSlot({ 
                                        dayIndex, 
                                        timeIndex, 
                                        date: selectedDate.toISOString().split('T')[0],
                                        time: selectedTime
                                      })
                                      setIsEventModalOpen(true)
                                    }
                                  }}
                                >
                                  {eventInSlot && (
                                    <motion.div
                                      className="text-xs"
                                      variants={popVariants}
                                      initial="hidden"
                                      animate="visible"
                                    >
                                      <div className="font-medium text-primary">{eventInSlot.subject || eventInSlot.title}</div>
                                      <div className="text-muted-foreground">
                                        {eventInSlot.tutor || eventInSlot.type}
                                        {eventInSlot.location && (
                                          <span className="block text-xs">📍 {eventInSlot.location}</span>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              )
                            })}
                          </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="schedule-scroll-container max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    <div className="space-y-3 pr-2">
                      {timeSlots.map((time, timeIndex) => {
                        // For day view, check if there's an event at this time
                        const today = new Date()
                        const todayDayIndex = (today.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
                        const eventForTime = getEventForTimeSlot(todayDayIndex, timeIndex)
                        const hasEvent = eventForTime !== null

                        return (
                          <div
                            key={time}
                            className={`flex items-center space-x-4 p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                              hasEvent ? "bg-primary/10 border-primary/30" : ""
                            }`}
                            onClick={() => {
                              if (!hasEvent) {
                                const today = new Date()
                                const selectedTime = timeSlots[timeIndex]
                                setSelectedSlot({ 
                                  dayIndex: -1, 
                                  timeIndex, 
                                  date: today.toISOString().split('T')[0],
                                  time: selectedTime
                                })
                                setIsEventModalOpen(true)
                              }
                            }}
                          >
                            <div className="text-sm font-medium w-16">{time}</div>
                            {hasEvent ? (
                              <div className="flex-1">
                                <div className="text-sm font-medium text-primary">{eventForTime.subject || eventForTime.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  {eventForTime.tutor || eventForTime.type}
                                  {eventForTime.location && ` • ${eventForTime.location}`}
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 text-sm text-muted-foreground">Available</div>
                            )}
                            {!hasEvent && (
                              <Button variant="ghost" size="sm">
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
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
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading sessions...</span>
                  </div>
                )}

                {!loading && databaseSessions.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                  </div>
                )}

                {!loading &&
                  databaseSessions
                    .filter((s) => s.status === "scheduled" && new Date(s.startTime) > new Date())
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .slice(0, 5)
                    .map((session, index) => {
                      const startTime = new Date(session.startTime)
                      const endTime = new Date(session.endTime)
                      const isToday = startTime.toDateString() === new Date().toDateString()
                      const isTomorrow = startTime.toDateString() === new Date(Date.now() + 86400000).toDateString()
                      const timeUntilStart = startTime.getTime() - Date.now()
                      const hoursUntilStart = Math.ceil(timeUntilStart / 3600000)
                      const isUpcoming = hoursUntilStart <= 2 && hoursUntilStart > 0

                      return (
                        <motion.div
                          key={session.id}
                          className="p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                          variants={itemVariants}
                          custom={index}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{session.subject}</h4>
                              <p className="text-sm text-muted-foreground">{session.tutorName}</p>
                            </div>
                            <Badge variant={isUpcoming ? "default" : "secondary"}>
                              {isUpcoming ? "Starting Soon" : "Scheduled"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })} -{" "}
                                {endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{isToday ? "Today" : isTomorrow ? "Tomorrow" : startTime.toLocaleDateString("en-US", { weekday: "short" })}</span>
                            </div>
                          </div>
                          {isUpcoming && (
                            <Button size="sm" className="w-full mt-3">
                              <Video className="h-4 w-4 mr-2" />
                              Join Session
                            </Button>
                          )}
                        </motion.div>
                      )
                    })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.main>

      <AddEventModal
        open={isEventModalOpen}
        onOpenChangeAction={setIsEventModalOpen}
        onEventAddedAction={handleEventAdded}
        selectedDate={selectedSlot?.date}
        selectedTime={selectedSlot?.time}
      />
    </div>
  )
}
