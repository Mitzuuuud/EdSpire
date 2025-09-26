"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Clock,
  Users,
  Video,
  MessageSquare,
  TrendingUp,
  Award,
  Target,
  BookOpen,
  Wallet,
  Star,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react"
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

const cardHoverVariants = {
  hover: {
    scale: 1.01,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1.0],
    } as const,
  },
} as const;

export default function TutorDashboard() {
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
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [notifications, setNotifications] = useState<string[]>([])

  // Load all dashboard data
  useEffect(() => {
    loadDashboardData()
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadDashboardData(true)
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
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

      // Load user sessions (tutor sessions)
      const userSessions = await getUserSessions(user.uid)
      setSessions(userSessions.slice(0, 10)) // Limit to recent sessions

      // Load user statistics
      const stats = await getUserStats(user.uid)
      setUserStats(stats)

    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      setError(error.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLastUpdated(new Date())
    }
  }

  const handleRefresh = () => {
    loadDashboardData(true)
  }

  // Check for sessions that should be marked as completed
  const checkSessionStatus = () => {
    const now = new Date()
    const updatedSessions = sessions.map(session => {
      if (session.status === 'scheduled' && new Date(session.endTime) <= now) {
        setNotifications(prev => [...prev, `Session "${session.subject}" with ${session.studentName} has been completed!`])
        return { ...session, status: 'completed' as const }
      }
      return session
    })
    
    if (JSON.stringify(updatedSessions) !== JSON.stringify(sessions)) {
      setSessions(updatedSessions)
    }
  }

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notifications])

  // Check session status every minute
  useEffect(() => {
    const statusInterval = setInterval(checkSessionStatus, 60000) // Check every minute
    return () => clearInterval(statusInterval)
  }, [sessions])

  const handleStartSession = () => {
    router.push("/tutor/video")
  }

  // Get next upcoming session
  const nextSession = sessions
    .filter(session => session.status === 'scheduled' && new Date(session.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]

  // Get upcoming sessions for display
  const upcomingSessions = sessions
    .filter(session => session.status === 'scheduled' && new Date(session.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3)

  // Calculate real stats from actual data
  const totalStudents = new Set(sessions.map(s => s.studentEmail)).size
  const totalHours = sessions.reduce((total, session) => {
    const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
    return total + duration
  }, 0)
  
  // Calculate completed sessions
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  
  // Calculate upcoming sessions
  const upcomingSessionsCount = sessions.filter(s => 
    s.status === 'scheduled' && new Date(s.startTime) > new Date()
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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

  return (
    <div className="min-h-screen bg-background">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-sm"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-sm">{notification}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.main
        className="mx-auto w-full max-w-7xl px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Section */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="text-center flex-1">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Welcome back, {userProfile?.name || currentUser?.email?.split('@')[0] || 'Tutor'}!
              </h1>
              <p className="text-muted-foreground">Here's an overview of your tutoring activities and upcoming sessions.</p>
              {lastUpdated && (
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-muted-foreground">
                    Live • Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </div>
        </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid gap-6 md:grid-cols-4 mb-8" variants={containerVariants}>
        {/* Total Students */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">{totalStudents}</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Hours */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Teaching Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">{Math.round(totalHours)}</span>
                <Clock className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completed Sessions */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">{completedSessions}</span>
                <Award className="h-4 w-4 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">{upcomingSessionsCount}</span>
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Upcoming Sessions - Spans 4 columns */}
        <motion.div className="lg:col-span-4" variants={itemVariants}>
          <motion.div whileHover="hover" variants={cardHoverVariants}>
            <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
                  <Button variant="outline" onClick={() => router.push("/tutor/schedule")}>View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.map((session, index) => (
                      <div key={session.id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Video className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{session.subject} with {session.studentName}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(session.startTime).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : 
                               new Date(session.startTime).toLocaleDateString() === new Date(Date.now() + 86400000).toLocaleDateString() ? 'Tomorrow' :
                               new Date(session.startTime).toLocaleDateString()}, {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={handleStartSession}
                          disabled={new Date(session.startTime) > new Date()}
                        >
                          {new Date(session.startTime) <= new Date() ? 'Start' : 'Pending'}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming sessions</p>
                      <p className="text-sm text-muted-foreground">Check your schedule for new bookings</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Student Progress - Spans 3 columns */}
        <motion.div className="lg:col-span-3" variants={itemVariants}>
          <motion.div whileHover="hover" variants={cardHoverVariants}>
            <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Student Progress</CardTitle>
                <CardDescription>Recent student achievements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  // Get recent completed sessions with students
                  const recentCompletedSessions = sessions
                    .filter(s => s.status === 'completed')
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .slice(0, 3)
                  
                  if (recentCompletedSessions.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No completed sessions yet</p>
                        <p className="text-sm text-muted-foreground">Student progress will appear here after sessions</p>
                      </div>
                    )
                  }
                  
                  return recentCompletedSessions.map((session, index) => {
                    // Calculate a mock progress based on session completion
                    const progress = Math.min(100, 70 + (index * 10) + Math.floor(Math.random() * 20))
                    const topics = ['Fundamentals', 'Advanced concepts', 'Problem solving', 'Practice exercises']
                    const topic = topics[Math.floor(Math.random() * topics.length)]
                    
                    return (
                      <div key={session.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{session.studentName}</span>
                          <Badge variant="secondary">{session.subject}</Badge>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {topic}: {progress}% • Completed {new Date(session.startTime).toLocaleDateString()}
                        </p>
                      </div>
                    )
                  })
                })()}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions - Spans full width */}
        <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-7">
          <motion.div whileHover="hover" variants={cardHoverVariants}>
            <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Frequently used features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-transparent"
                      onClick={() => router.push("/tutor/video")}
                    >
                      <Video className="h-6 w-6 text-primary" />
                      <span>Start Session</span>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-transparent"
                      onClick={() => router.push("/tutor/schedule")}
                    >
                      <Calendar className="h-6 w-6 text-primary" />
                      <span>View Schedule</span>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-transparent"
                      onClick={() => router.push("/tutor/chat")}
                    >
                      <MessageSquare className="h-6 w-6 text-primary" />
                      <span>Message Students</span>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-transparent"
                      onClick={() => router.push("/tutor/leaderboard")}
                    >
                      <Award className="h-6 w-6 text-primary" />
                      <span>Tutor Rankings</span>
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.main>
    </div>
  )
}
