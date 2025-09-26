"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Clock, User, BookOpen, Coins, RefreshCw, Trash2, AlertCircle, Clock3, CheckCircle, XCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { getUserSessions, cancelSession } from "@/lib/session-booking"
import { getStudentBookingRequests } from "@/lib/booking-requests"
import type { BookedSession } from "@/lib/session-booking"
import type { BookingRequest } from "@/lib/booking-requests"

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

function getRequestStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'accepted':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function MySessionsPage() {
  const [sessions, setSessions] = useState<BookedSession[]>([])
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancelDialog, setCancelDialog] = useState<{open: boolean, session: BookedSession | null}>({open: false, session: null})
  const [isCanceling, setIsCanceling] = useState(false)
  const [activeTab, setActiveTab] = useState<"sessions" | "requests">("sessions")

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

  const loadBookingRequests = async () => {
    if (!currentUser) return

    try {
      console.log(`Loading booking requests for user: ${currentUser.email} (${currentUser.uid})`)
      const requests = await getStudentBookingRequests(currentUser.uid)
      console.log(`Loaded ${requests.length} booking requests for ${currentUser.email}:`, requests)
      setBookingRequests(requests)
    } catch (err: any) {
      console.error('Error loading booking requests:', err)
      setError(err?.message || 'Failed to load booking requests')
    }
  }

  const loadAllData = async () => {
    if (!currentUser) return

    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        loadSessions(),
        loadBookingRequests()
      ])
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err?.message || 'Failed to load data')
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
      loadAllData()
    } else {
      setLoading(false)
    }
  }, [currentUser])

  const handleCancelSession = (session: BookedSession) => {
    setCancelDialog({open: true, session})
  }

  const confirmCancelSession = async () => {
    if (!cancelDialog.session?.id || !currentUser) return

    setIsCanceling(true)

    try {
      console.log(`Canceling session ${cancelDialog.session.id}`)
      
      const result = await cancelSession(currentUser.uid, cancelDialog.session.id)
      
      if (result.success) {
        console.log('Session canceled successfully')
        console.log(`Refunded ${result.refundAmount} tokens. New balance: ${result.newBalance}`)
        
        // Remove the session from local state
        setSessions(prev => prev.filter(s => s.id !== cancelDialog.session?.id))
        setCancelDialog({open: false, session: null})
        
        // Reload sessions to get updated data
        loadSessions()
      } else {
        console.error('Failed to cancel session:', result.error)
        setError(result.error || 'Failed to cancel session')
      }
      
    } catch (err: any) {
      console.error('Error canceling session:', err)
      setError(err?.message || 'Failed to cancel session')
    } finally {
      setIsCanceling(false)
    }
  }

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
                <h1 className="font-display text-3xl font-bold text-foreground">My Sessions & Requests</h1>
              </div>
              <p className="text-muted-foreground">View and manage your booked sessions and booking requests</p>
            </div>
            <Button onClick={loadAllData} disabled={loading || !currentUser} className="flex items-center space-x-2">
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

        {currentUser && !loading && (
          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sessions" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Sessions ({sessions.length})</span>
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center space-x-2">
                  <Clock3 className="h-4 w-4" />
                  <span>Requests ({bookingRequests.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sessions" className="mt-6">
                {sessions.length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-sm text-muted-foreground mb-4">
                      Showing {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                    </div>

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
                          <div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleCancelSession(session)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Cancel Session
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
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <div className="font-medium">No sessions found</div>
                        <div className="text-sm mt-1">You haven't booked any sessions yet</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="requests" className="mt-6">
                {bookingRequests.length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-sm text-muted-foreground mb-4">
                      Showing {bookingRequests.length} booking request{bookingRequests.length !== 1 ? 's' : ''}
                    </div>

                    {bookingRequests.map((request) => (
                      <motion.div key={request.id} variants={itemVariants}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{request.subject}</CardTitle>
                                  <div className="text-sm text-muted-foreground">
                                    with {request.tutorName}
                                  </div>
                                </div>
                              </div>
                              <Badge className={getRequestStatusColor(request.status)}>
                                {request.status === 'pending' && <Clock3 className="h-3 w-3 mr-1" />}
                                {request.status === 'accepted' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{new Date(request.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{request.time}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span>{request.topic}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <Coins className="h-4 w-4 text-muted-foreground" />
                                  <span>{request.cost} EDS</span>
                                </div>
                              </div>

                              <div className="space-y-2 text-right">
                                <div className="text-xs text-muted-foreground">
                                  Duration: {request.duration} min
                                </div>
                                {request.urgency && (
                                  <div className="text-xs text-muted-foreground">
                                    Urgency: {request.urgency}
                                  </div>
                                )}
                              </div>
                            </div>

                            {request.message && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="text-sm text-muted-foreground mb-2">Your Message:</div>
                                <div className="text-sm">{request.message}</div>
                              </div>
                            )}

                            {request.status === 'pending' && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="text-sm text-muted-foreground">
                                  Waiting for tutor response...
                                </div>
                              </div>
                            )}

                            {request.status === 'accepted' && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="text-sm text-green-600 font-medium">
                                  ✓ Request accepted! This session has been added to your calendar.
                                </div>
                              </div>
                            )}

                            {request.status === 'rejected' && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="text-sm text-red-600 font-medium">
                                  ✗ Request rejected by tutor.
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-muted-foreground">
                        <Clock3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <div className="font-medium">No booking requests found</div>
                        <div className="text-sm mt-1">You haven't made any booking requests yet</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </motion.main>

      {/* Cancel Session Confirmation Dialog */}
      <Dialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog({open, session: null})}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <span>Cancel Session</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this session? Your tokens will be refunded.
            </DialogDescription>
          </DialogHeader>

          {cancelDialog.session && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="text-sm font-medium mb-2">Session Details:</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subject:</span>
                    <span className="font-medium">{cancelDialog.session.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tutor:</span>
                    <span className="font-medium">{cancelDialog.session.tutorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{formatDateTime(cancelDialog.session.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">
                      {formatTime(cancelDialog.session.startTime)} - {formatTime(cancelDialog.session.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-medium text-green-600">{cancelDialog.session.cost} EDS</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3 bg-green-50 border-green-200">
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <Coins className="h-4 w-4" />
                  <span className="font-medium">Token Refund:</span>
                </div>
                <div className="text-green-600 text-sm mt-1">
                  Canceling this session will refund {cancelDialog.session.cost} EDS tokens back to your account balance.
                </div>
              </div>

              {error && (
                <div className="rounded-lg border p-3 bg-red-50 border-red-200">
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setCancelDialog({open: false, session: null})}
              className="flex-1"
              disabled={isCanceling}
            >
              Keep Session
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmCancelSession}
              className="flex-1"
              disabled={isCanceling}
            >
              {isCanceling ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Canceling...
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Cancel Session
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}