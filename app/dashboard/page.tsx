"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, Users, Video, MessageSquare, TrendingUp, Award, Target, Loader2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { getUserSessions, type BookedSession } from "@/lib/session-booking"
import { getUserStats, getUserProfile, type UserProfile } from "@/lib/profile-service"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      staggerChildren: 0.1,
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
    },
  },
}

export default function Dashboard() {
  const router = useRouter()
  
  // State management
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [sessions, setSessions] = useState<BookedSession[]>([])
  const [userStats, setUserStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalHours: 0
  })
  const [customEvents, setCustomEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load current user from localStorage
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        setError("Please sign in to view dashboard")
        setLoading(false)
        return
      }

      const user = JSON.parse(userStr)
      setCurrentUser(user)

      // Load user profile
      const profileResult = await getUserProfile(user.uid)
      if (profileResult.success && profileResult.profile) {
        setUserProfile(profileResult.profile)
      }

      // Load user sessions
      const userSessions = await getUserSessions(user.uid)
      setSessions(userSessions.slice(0, 10)) // Limit to recent sessions

      // Load user statistics
      const stats = await getUserStats(user.uid)
      setUserStats(stats)

      // Load custom events from localStorage
      try {
        const savedEvents = localStorage.getItem('customEvents')
        if (savedEvents) {
          const events = JSON.parse(savedEvents).map((event: any) => ({
            ...event,
            actualDate: new Date(event.date)
          }))
          setCustomEvents(events.slice(0, 5)) // Limit to recent events
        }
      } catch (eventError) {
        console.error('Failed to load custom events:', eventError)
      }

    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      setError(error.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSession = () => {
    router.push("/video")
  }

  // Get next upcoming session
  const nextSession = sessions
    .filter(session => session.status === 'scheduled' && new Date(session.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]

  // Get upcoming tasks (all future events, prioritized by urgency and type)
  const upcomingTasks = customEvents
    .filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= new Date() // Include today's events
    })
    .sort((a, b) => {
      // Sort by date first (most urgent first)
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateA - dateB
      
      // Then by priority (high > medium > low)
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 }
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3
      if (priorityA !== priorityB) return priorityA - priorityB
      
      // Finally by event type (Assignment > Study > Meeting > Break > Tutoring)
      const typeOrder = { 'Assignment': 0, 'Study': 1, 'Meeting': 2, 'Break': 3, 'Tutoring': 4 }
      const typeA = typeOrder[a.type as keyof typeof typeOrder] ?? 5
      const typeB = typeOrder[b.type as keyof typeof typeOrder] ?? 5
      return typeA - typeB
    })
    .slice(0, 3)

  // Calculate progress metrics (simplified)
  const getSubjectProgress = () => {
    const subjects: { [key: string]: { completed: number, total: number } } = {}
    
    sessions.forEach(session => {
      if (!subjects[session.subject]) {
        subjects[session.subject] = { completed: 0, total: 0 }
      }
      subjects[session.subject].total++
      if (session.status === 'completed') {
        subjects[session.subject].completed++
      }
    })

    return Object.entries(subjects).map(([subject, data]) => ({
      subject,
      progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    })).slice(0, 3)
  }

  // Calculate weekly stats
  const getWeeklyStats = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const weeklySessions = sessions.filter(session => 
      new Date(session.startTime) >= oneWeekAgo
    )

    const weeklyCompletedSessions = weeklySessions.filter(session => 
      session.status === 'completed'
    ).length

    const weeklyTotalHours = weeklySessions.reduce((total, session) => {
      const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
      return total + duration
    }, 0)

    const weeklyTasks = customEvents.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= oneWeekAgo && eventDate <= new Date() && event.type === 'Assignment'
    }).length

    return {
      studyHours: Math.round(weeklyTotalHours * 10) / 10,
      sessionsCompleted: weeklyCompletedSessions,
      tasksCompleted: weeklyTasks,
      weeklyGoal: userStats.totalSessions > 0 ? Math.round((weeklyCompletedSessions / Math.max(userStats.totalSessions * 0.2, 1)) * 100) : 0
    }
  }

  // Get recent activity
  const getRecentActivity = () => {
    const activities: Array<{id: string, text: string, time: string, color: string}> = []

    // Add completed sessions
    const recentSessions = sessions
      .filter(session => session.status === 'completed')
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 2)

    recentSessions.forEach(session => {
      const timeAgo = getTimeAgo(new Date(session.endTime))
      activities.push({
        id: `session-${session.id}`,
        text: `Completed ${session.subject} session with ${session.tutorName}`,
        time: timeAgo,
        color: 'bg-primary'
      })
    })

    // Add recent events
    const recentEvents = customEvents
      .filter(event => new Date(event.date) <= new Date())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2)

    recentEvents.forEach(event => {
      const timeAgo = getTimeAgo(new Date(event.date))
      activities.push({
        id: `event-${event.id}`,
        text: `${event.type === 'Assignment' ? 'Submitted' : 'Completed'} ${event.title}`,
        time: timeAgo,
        color: event.type === 'Assignment' ? 'bg-green-500' : 'bg-blue-500'
      })
    })

    // Add upcoming sessions
    const upcomingSessions = sessions
      .filter(session => session.status === 'scheduled' && new Date(session.startTime) > new Date())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 1)

    upcomingSessions.forEach(session => {
      const timeAgo = getTimeAgo(new Date(session.startTime), true)
      activities.push({
        id: `upcoming-${session.id}`,
        text: `Booked session with ${session.tutorName}`,
        time: timeAgo,
        color: 'bg-blue-500'
      })
    })

    return activities.slice(0, 3)
  }

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date, future = false) => {
    const now = new Date()
    const diffMs = future ? date.getTime() - now.getTime() : now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffHours < 1) {
      return future ? 'Soon' : 'Just now'
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours)
      return future ? `in ${hours}h` : `${hours}h ago`
    } else {
      const days = Math.floor(diffDays)
      return future ? `in ${days}d` : `${days}d ago`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/signin'}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const subjectProgress = getSubjectProgress()
  const weeklyStats = getWeeklyStats()
  const recentActivity = getRecentActivity()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.main
        className="container mx-auto px-6 py-8 max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-8 text-center" variants={itemVariants}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome back, {userProfile?.name || currentUser?.email?.split('@')[0] || 'Student'}
          </h1>
          <p className="text-muted-foreground">Ready to continue your learning journey?</p>
          
          {/* Quick Stats Summary */}
          <div className="flex justify-center items-center space-x-8 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-primary/5">
                {userStats.totalSessions} sessions
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50">
                {userStats.totalHours}h studied
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50">
                {userStats.upcomingSessions} upcoming
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadDashboardData}
              className="text-muted-foreground hover:text-foreground"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </motion.div>

        <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={containerVariants}>
          {/* Next Session Card */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ scale: 1.01 }}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[280px] flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Next Session</CardTitle>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  {nextSession ? (
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">{nextSession.subject}</p>
                        <p className="text-sm text-muted-foreground">with {nextSession.tutorName}</p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(nextSession.startTime).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : 
                           new Date(nextSession.startTime).toLocaleDateString() === new Date(Date.now() + 86400000).toLocaleDateString() ? 'Tomorrow' :
                           new Date(nextSession.startTime).toLocaleDateString()}, {new Date(nextSession.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(nextSession.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          {getTimeAgo(new Date(nextSession.startTime), true)}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">No upcoming sessions</p>
                        <p className="text-sm text-muted-foreground">Book a session to get started</p>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Schedule your next learning session</span>
                      </div>
                    </div>
                  )}
                  <Button 
                    className="w-full mt-4" 
                    size="sm" 
                    onClick={nextSession ? handleJoinSession : () => router.push('/schedule')}
                  >
                    {nextSession ? 'Join Session' : 'Schedule Session'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Progress Card */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ scale: 1.01 }}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[280px] flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Progress</CardTitle>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    {subjectProgress.length > 0 ? (
                      <>
                        {subjectProgress.map((subject, index) => (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-2">
                              <span>{subject.subject}</span>
                              <span className="font-medium">{subject.progress}%</span>
                            </div>
                            <Progress value={subject.progress} className="h-2" />
                          </div>
                        ))}
                        <div className="pt-2 border-t border-border/50">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Overall Progress</span>
                            <span className="font-medium text-primary">
                              {Math.round(subjectProgress.reduce((acc, s) => acc + s.progress, 0) / subjectProgress.length)}%
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Complete some sessions to see your progress</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Tasks Card */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ scale: 1.01 }}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[280px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                      {customEvents.filter(event => new Date(event.date) >= new Date()).length} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingTasks.length > 0 ? (
                      upcomingTasks.map((task, index) => {
                        const taskDate = new Date(task.date)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const daysUntilDue = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        
                        // Determine urgency based on date and priority
                        const isToday = daysUntilDue === 0
                        const isTomorrow = daysUntilDue === 1
                        const isUrgent = (isToday || isTomorrow) || (daysUntilDue <= 3 && task.priority === 'high')
                        const isThisWeek = daysUntilDue <= 7
                        
                        // Get event type styling
                        const getEventTypeColor = (type: string, priority: string) => {
                          if (type === 'Assignment') return isUrgent ? 'bg-red-500' : 'bg-orange-500'
                          if (type === 'Study') return isUrgent ? 'bg-blue-600' : 'bg-blue-500'
                          if (type === 'Meeting') return isUrgent ? 'bg-purple-600' : 'bg-purple-500'
                          if (type === 'Tutoring') return isUrgent ? 'bg-green-600' : 'bg-green-500'
                          return isUrgent ? 'bg-gray-600' : 'bg-gray-500'
                        }
                        
                        const getEventIcon = (type: string) => {
                          if (type === 'Assignment') return '📝'
                          if (type === 'Study') return '📚'
                          if (type === 'Meeting') return '👥'
                          if (type === 'Tutoring') return '🎓'
                          return '📅'
                        }
                        
                        return (
                          <div key={task.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${getEventTypeColor(task.type, task.priority)} flex items-center justify-center`}>
                                <span className="text-[8px]">{getEventIcon(task.type)}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">{task.title}</span>
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                    {task.type}
                                  </Badge>
                                </div>
                                {task.startTime && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {task.startTime} {task.endTime && `- ${task.endTime}`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge variant="outline" className={`text-xs ${
                                isToday 
                                  ? 'border-red-200 text-red-700 bg-red-50' 
                                  : isTomorrow
                                    ? 'border-orange-200 text-orange-700 bg-orange-50'
                                    : isUrgent 
                                      ? 'border-yellow-200 text-yellow-700 bg-yellow-50' 
                                      : isThisWeek 
                                        ? 'border-blue-200 text-blue-700 bg-blue-50' 
                                        : 'border-green-200 text-green-700 bg-green-50'
                              }`}>
                                {isToday ? 'Today' : 
                                 isTomorrow ? 'Tomorrow' : 
                                 daysUntilDue <= 7 ? `${daysUntilDue}d` :
                                 taskDate.toLocaleDateString([], {month: 'short', day: 'numeric'})}
                              </Badge>
                              {task.priority && (
                                <Badge variant="outline" className={`text-xs ${
                                  task.priority === 'high' ? 'border-red-200 text-red-600' :
                                  task.priority === 'medium' ? 'border-yellow-200 text-yellow-600' :
                                  'border-gray-200 text-gray-600'
                                }`}>
                                  {task.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No upcoming tasks</p>
                        <p className="text-xs">Add events to your schedule to see tasks here</p>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 bg-transparent"
                      onClick={() => router.push('/schedule')}
                    >
                      View All Tasks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Study Stats Card */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ scale: 1.01 }}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[280px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">This Week</CardTitle>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Study Hours</span>
                      <span className="font-medium">{weeklyStats.studyHours}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sessions Completed</span>
                      <span className="font-medium">{weeklyStats.sessionsCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tasks Completed</span>
                      <span className="font-medium">{weeklyStats.tasksCompleted}</span>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Weekly Goal</span>
                        <span className="text-sm font-medium text-primary">{Math.min(weeklyStats.weeklyGoal, 100)}% Complete</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Recent Activity Card */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover={{ scale: 1.01 }}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[280px]">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 ${activity.color} rounded-full mt-2`}></div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.text}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent activity</p>
                        <p className="text-xs">Complete sessions or events to see activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
            <motion.div whileHover={{ scale: 1.01 }}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Get started with common tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2 bg-transparent w-full"
                        onClick={() => router.push('/tutors')}
                      >
                        <Users className="h-6 w-6" />
                        <span>Find Tutor</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2 bg-transparent w-full"
                        onClick={() => router.push('/schedule')}
                      >
                        <Calendar className="h-6 w-6" />
                        <span>Schedule Event</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2 bg-transparent w-full"
                        onClick={() => router.push('/video')}
                      >
                        <Video className="h-6 w-6" />
                        <span>Start Video Call</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col space-y-2 bg-transparent w-full"
                        onClick={() => router.push('/chat')}
                      >
                        <MessageSquare className="h-6 w-6" />
                        <span>Ask AI Assistant</span>
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.main>
    </div>
  )
}