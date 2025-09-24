"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, User, BookOpen, Coins, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { getUserSessions } from "@/lib/session-booking"
import type { BookedSession } from "@/lib/session-booking"

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
    },
  },
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function MySessionsPage() {
  const [sessions, setSessions] = useState<BookedSession[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSessions = async () => {
    if (!currentUser) return

    setLoading(true)
    setError(null)

    try {
      console.log(`Loading sessions for user: ${currentUser.email} (${currentUser.uid})`)
      const userSessions = await getUserSessions(currentUser.uid)
      console.log(`Loaded ${userSessions.length} sessions for ${currentUser.email}:`, userSessions)
      setSessions(userSessions)
    } catch (err: any) {
      console.error('Error loading sessions:', err)
      setError(err?.message || 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load current user
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
      }
    } catch (e) {
      console.error('Failed to load user:', e)
      setCurrentUser(null)
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadSessions()
    } else {
      setLoading(false)
    }
  }, [currentUser])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.main 
        className="mx-auto w-full max-w-4xl px-6 py-8" 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
      >
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <h1 className="font-display text-3xl font-bold text-foreground">My Sessions</h1>
              </div>
              <p className="text-muted-foreground">View and manage your booked tutoring sessions</p>
            </div>
            <Button onClick={loadSessions} disabled={loading || !currentUser} className="flex items-center space-x-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </motion.div>

        {!currentUser && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  Please sign in to view your booked sessions
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentUser && loading && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading your sessions...</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentUser && error && (
          <motion.div variants={itemVariants}>
            <Card className="border-red-200">
              <CardContent className="p-6 text-center text-red-600">
                <div className="font-medium">Error loading sessions</div>
                <div className="text-sm mt-1">{error}</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentUser && !loading && !error && sessions.length === 0 && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <div className="font-medium">No sessions found</div>
                  <div className="text-sm mt-1">You haven't booked any sessions yet</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentUser && !loading && sessions.length > 0 && (
          <div className="space-y-6">
            <motion.div variants={itemVariants}>
              <div className="text-sm text-muted-foreground mb-4">
                Showing {sessions.length} session{sessions.length !== 1 ? 's' : ''}
              </div>
            </motion.div>

            {sessions.map((session) => (
              <motion.div key={session.id} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{session.subject}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            with {session.tutorName}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDateTime(session.startTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <Coins className="h-4 w-4 text-muted-foreground" />
                          <span>{session.cost} EDS</span>
                        </div>
                        {session.notes && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Notes:</span> {session.notes}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-right">
                        <div className="text-xs text-muted-foreground">
                          Session ID: {session.id}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Booked: {session.createdAt ? new Date(session.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </div>

                    {session.status === 'scheduled' && new Date() < session.startTime && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Starts in {Math.ceil((session.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} day(s)
                          </div>
                          <div className="space-x-2">
                            <Button variant="outline" size="sm">
                              Reschedule
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.main>
    </div>
  )
}