"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { AddEventModal } from "@/components/add-event-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Video, RefreshCw, MessageCircle, Edit2, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { getUserSessions } from "@/lib/session-booking"
import type { BookedSession as DatabaseBookedSession } from "@/lib/session-booking"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      staggerChildren: 0.05,
    } as const,
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.1, 0.25, 1.0],
    } as const,
  },
} as const;

const popVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    } as const,
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
    title: "Self Study Physics",
    tutor: "Prof. Emily Davis",
    time: "2:00 PM - 3:00 PM",
    date: "Friday",
    subject: "Chemistry",
    type: "video",
    status: "scheduled",
  },
]

// Generate 24-hour time slots (00:00 to 23:00)
const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return `${hour}:00`
})

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const fullWeekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const getWeekOfMonthLabel = (weekOffset: number) => {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() + weekOffset * 7)

  const month = startOfWeek.toLocaleDateString("en-US", { month: "long" })
  const year = startOfWeek.getFullYear()

  // figure out which week of the month it is
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
  const [viewMode, setViewMode] = useState<"week" | "day" | "month">("week")
  const [currentWeek, setCurrentWeek] = useState(0)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([])
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([])
  const [databaseSessions, setDatabaseSessions] = useState<DatabaseBookedSession[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{ dayIndex: number; timeIndex: number; date?: string; time?: string } | null>(null)
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<CustomEvent | null>(null)

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

  // Load user sessions from database
  const loadUserSessions = async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      console.log(`Loading sessions for calendar for user: ${currentUser.email}`)
      const sessions = await getUserSessions(currentUser.uid)
      setDatabaseSessions(sessions)
      console.log(`Loaded ${sessions.length} sessions for calendar`, sessions)
    } catch (error) {
      console.error('Error loading sessions for calendar:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load current user on component mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
        setLoading(false)
      }
    } catch (e) {
      console.error('Failed to load user for schedule:', e)
      setCurrentUser(null)
      setLoading(false)
    }
  }, [])

  // Load sessions when user is available
  useEffect(() => {
    if (currentUser) {
      loadUserSessions()
    }
  }, [currentUser])

  // Load custom events from localStorage
  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem('customEvents')
      if (savedEvents) {
        const events = JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          actualDate: new Date(event.date),
        }))
        setCustomEvents(events)
      }
    } catch (error) {
      console.error('Failed to load custom events:', error)
    }
  }, [])

  // Auto-scroll to current time when view changes to week/day
  useEffect(() => {
    if (viewMode === 'week' || viewMode === 'day') {
      const currentHour = new Date().getHours()
      const scrollTarget = Math.max(0, currentHour - 2) // Show 2 hours before current time
      
      setTimeout(() => {
        const scrollContainer = document.querySelector('.schedule-scroll-container')
        if (scrollContainer) {
          const timeSlotHeight = 68 // min-h-[60px] + gap
          scrollContainer.scrollTop = scrollTarget * timeSlotHeight
        }
      }, 100) // Small delay to ensure DOM is rendered
    }
  }, [viewMode])

  const getEventsForDate = (date: Date) => {
    // Combine custom events, manual booked sessions and database sessions
    const customEventsForDate = customEvents
      .filter((event) => event.actualDate && event.actualDate.toDateString() === date.toDateString())
      .map((event) => ({
        id: event.id,
        title: event.title,
        subject: event.title,
        type: event.type,
        priority: event.priority,
        time: `${event.startTime} - ${event.endTime}`,
        location: event.location,
        description: event.description,
        isCustomEvent: true,
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
      type: "tutoring",
      time: session.time,
      tutor: session.tutor,
      isCustomEvent: false,
    }))

    const dbSessions = databaseSessions.filter((session) => {
      const sessionDate = new Date(session.startTime)
      return sessionDate.toDateString() === date.toDateString()
    }).map((session) => ({
      id: session.id || 'unknown',
      title: session.subject,
      tutor: session.tutorName,
      subject: session.subject,
      type: "tutoring",
      time: `${session.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${session.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      isCustomEvent: false,
    }))

    return [...customEventsForDate, ...manualSessions, ...dbSessions]
  }

  const getEventForTimeSlot = (dayIndex: number, timeIndex: number) => {
    const weekDates = getWeekDates(currentWeek)
    const targetDate = weekDates[dayIndex]
    const targetHour = parseInt(timeSlots[timeIndex].split(':')[0])

    // Check custom events first
    const customEvent = customEvents.find((event) => {
      if (!event.actualDate) return false
      const eventStartHour = parseInt(event.startTime.split(':')[0])
      return event.actualDate.toDateString() === targetDate.toDateString() && eventStartHour === targetHour
    })

    if (customEvent) {
      return {
        id: customEvent.id,
        title: customEvent.title,
        subject: customEvent.title,
        type: customEvent.type,
        priority: customEvent.priority,
        location: customEvent.location,
        isCustomEvent: true,
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
        isCustomEvent: false,
      }
    }

    // Check database sessions
    const dbSession = databaseSessions.find((session) => {
      const sessionDate = new Date(session.startTime)
      const sessionHour = sessionDate.getHours()
      
      return sessionDate.toDateString() === targetDate.toDateString() && 
             sessionHour === targetHour
    })

    if (dbSession) {
      return {
        id: dbSession.id || 'unknown',
        title: dbSession.subject,
        tutor: dbSession.tutorName,
        subject: dbSession.subject,
        type: "tutoring",
        isCustomEvent: false,
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

    // Save to localStorage
    const existingEvents = JSON.parse(localStorage.getItem('customEvents') || '[]')
    localStorage.setItem('customEvents', JSON.stringify([...existingEvents, newEvent]))
  }

  const handleEventEdit = (event: CustomEvent) => {
    setEditingEvent(event)
    setIsEventModalOpen(true)
  }

  const handleEventDelete = (eventId: string) => {
    setCustomEvents((prev) => prev.filter(e => e.id !== eventId))
    
    // Update localStorage
    const existingEvents = JSON.parse(localStorage.getItem('customEvents') || '[]')
    const updatedEvents = existingEvents.filter((e: any) => e.id !== eventId)
    localStorage.setItem('customEvents', JSON.stringify(updatedEvents))
  }

  const handleJoinSession = () => {
    window.open('/video', '_blank')
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
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
                <span className="font-medium min-w-[160px] text-center">
                  {viewMode === "month"
                    ? currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : getWeekOfMonthLabel(currentWeek)}
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
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="day">Day View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            {(viewMode === 'week' || viewMode === 'day') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentHour = new Date().getHours()
                  const scrollTarget = Math.max(0, currentHour - 2)
                  const scrollContainer = document.querySelector('.schedule-scroll-container')
                  if (scrollContainer) {
                    const timeSlotHeight = 68
                    scrollContainer.scrollTo({
                      top: scrollTarget * timeSlotHeight,
                      behavior: 'smooth'
                    })
                  }
                }}
                className="text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                Now ({new Date().getHours().toString().padStart(2, '0')}:00)
              </Button>
            )}
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
          </div>
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
                        const eventsForDate = getEventsForDate(date)

                        return (
                          <motion.div
                            key={index}
                            className={`min-h-[80px] p-2 border border-border/50 rounded-lg cursor-pointer transition-colors ${
                              isCurrentMonth ? "hover:bg-muted/50" : "bg-muted/20 text-muted-foreground"
                            } ${isToday ? "bg-primary/10 border-primary/30" : ""}`}
                            variants={popVariants}
                            onClick={() => {
                              if (isCurrentMonth) {
                                setSelectedSlot({
                                  dayIndex: -1,
                                  timeIndex: -1,
                                  date: date.toISOString().split('T')[0],
                                })
                                setIsEventModalOpen(true)
                              }
                            }}
                          >
                            <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                              {date.getDate()}
                            </div>
                            {eventsForDate.map((event: any, eventIndex: number) => (
                              <div key={eventIndex} className="text-xs mb-1 p-1 bg-primary/10 rounded truncate">
                                <div className="font-medium text-primary">{event.subject || event.title}</div>
                                <div className="text-muted-foreground">{event.time}</div>
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
                    <div className="schedule-scroll-container max-h-[600px] overflow-y-auto">
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
                                        time: selectedTime,
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
                                      <div className="font-medium text-primary">
                                        {eventInSlot.subject || eventInSlot.title}
                                      </div>
                                      <div className="text-muted-foreground">
                                        {eventInSlot.tutor || eventInSlot.type}
                                        {eventInSlot.location && (
                                          <span className="block text-xs">📍 {eventInSlot.location}</span>
                                        )}
                                      </div>
                                      <div className="mt-1 flex gap-1">
                                        {eventInSlot.isCustomEvent ? (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 px-1 text-xs"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                const event = customEvents.find(e => e.id === eventInSlot.id)
                                                if (event) handleEventEdit(event)
                                              }}
                                            >
                                              <Edit2 className="h-2 w-2" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 px-1 text-xs text-red-600"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleEventDelete(eventInSlot.id)
                                              }}
                                            >
                                              <Trash2 className="h-2 w-2" />
                                            </Button>
                                          </>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-2 text-xs"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleJoinSession()
                                            }}
                                          >
                                            <Video className="h-3 w-3 mr-1" />
                                            Join
                                          </Button>
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
                  <div className="schedule-scroll-container max-h-[600px] overflow-y-auto">
                    <div className="space-y-3 pr-2">
                      {timeSlots.map((time, timeIndex) => {
                        // For day view, check if there's a session at this time
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
                                setSelectedSlot({
                                  dayIndex: todayDayIndex,
                                  timeIndex,
                                  date: today.toISOString().split('T')[0],
                                  time: time,
                                })
                                setIsEventModalOpen(true)
                              }
                            }}
                          >
                            <div className="text-sm font-medium w-16">{time}</div>
                            {hasEvent ? (
                              <div className="flex-1">
                                <div className="text-sm font-medium text-primary">
                                  {eventForTime.subject || eventForTime.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {eventForTime.tutor || eventForTime.type}
                                  {eventForTime.location && (
                                    <span className="block">📍 {eventForTime.location}</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 text-sm text-muted-foreground">Available</div>
                            )}
                            {hasEvent ? (
                              <div className="flex gap-1">
                                {eventForTime.isCustomEvent ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        const event = customEvents.find(e => e.id === eventForTime.id)
                                        if (event) handleEventEdit(event)
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEventDelete(eventForTime.id)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleJoinSession()
                                    }}
                                  >
                                    <Video className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ) : (
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

                {!loading && databaseSessions
                  .filter(session => session.status === 'scheduled' && new Date(session.startTime) > new Date())
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 5)
                  .map((session, index) => {
                    const startTime = new Date(session.startTime)
                    const endTime = new Date(session.endTime)
                    const isToday = startTime.toDateString() === new Date().toDateString()
                    const isTomorrow = startTime.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
                    const timeUntilStart = startTime.getTime() - new Date().getTime()
                    const hoursUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60))
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
                              {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : startTime.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </div>
                        </div>
                        {isUpcoming && (
                          <Button size="sm" className="w-full mt-3" onClick={handleJoinSession}>
                            <Video className="h-4 w-4 mr-2" />
                            Join Session
                          </Button>
                        )}
                      </motion.div>
                    )
                  })
                }
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                    <span className="text-xs text-muted-foreground">Loading stats...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">This Week</span>
                      <span className="font-medium">
                        {databaseSessions.filter(session => {
                          const sessionDate = new Date(session.startTime)
                          const weekStart = getStartOfWeek(currentWeek)
                          const weekEnd = new Date(weekStart)
                          weekEnd.setDate(weekStart.getDate() + 7)
                          return sessionDate >= weekStart && sessionDate < weekEnd
                        }).length} sessions
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Hours</span>
                      <span className="font-medium">
                        {databaseSessions.reduce((total, session) => {
                          const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
                          return total + duration
                        }, 0).toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Next Session</span>
                      <span className="font-medium text-primary">
                        {(() => {
                          const nextSession = databaseSessions
                            .filter(session => new Date(session.startTime) > new Date())
                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]
                          
                          if (!nextSession) return 'None scheduled'
                          
                          const timeUntil = new Date(nextSession.startTime).getTime() - new Date().getTime()
                          const hoursUntil = Math.ceil(timeUntil / (1000 * 60 * 60))
                          const daysUntil = Math.ceil(timeUntil / (1000 * 60 * 60 * 24))
                          
                          if (hoursUntil < 1) return 'Starting soon'
                          if (hoursUntil < 24) return `In ${hoursUntil}h`
                          return `In ${daysUntil} day${daysUntil > 1 ? 's' : ''}`
                        })()}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.main>

      <AddEventModal
        open={isEventModalOpen}
        onOpenChangeAction={(open) => {
          setIsEventModalOpen(open)
          if (!open) {
            setEditingEvent(null)
          }
        }}
        onEventAddedAction={handleEventAdded}
        selectedDate={selectedSlot?.date}
        selectedTime={selectedSlot?.time}
        editingEvent={editingEvent}
      />
    </div>
  )
}
