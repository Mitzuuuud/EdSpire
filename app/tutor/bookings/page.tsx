"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, CheckCircle, XCircle, MessageSquare, Video, BookOpen, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { getTutorBookingRequests, updateBookingRequestStatus, convertRequestToSession, type BookingRequest } from "@/lib/booking-requests"
import { refundTokens } from "@/lib/token-deduction"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.28, staggerChildren: 0.08 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24 } },
} as const

// subtle lift + scale on hover
const cardHoverVariants = {
  hover: { y: -3, scale: 1.01, transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] } },
} as const

// ---------- NEW: normalization helpers ----------
const normalizeStatus = (s?: string) =>
  (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^accept$/, "accepted")
    .replace(/^accepted$/, "accepted")
    .replace(/^reject$/, "rejected")
    .replace(/^rejected$/, "rejected")

const statusOf = (b: BookingRequest) => normalizeStatus((b as any).status)

// ------------------------------------------------

export default function TutorBookings() {
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected">("pending")

  // theme colors (warm + readable)
  const beige100 = "#fdfaf6"
  const beige200 = "#f3e9dd"
  const beige300 = "#e9dfd1"
  const textDeep = "#4a4033"
  const olive = "#5f7c57"       // accepted
  const amber = "#b4843b"       // pending
  const terra = "#b35c44"       // rejected

  const getStatusChip = (status: "pending" | "accepted" | "rejected") => {
    const base = "rounded-full px-2.5 py-0.5 ring-1 text-[12px] font-medium"
    // intentionally using same chip style; text color cues come from surrounding UI
    return `${base} bg-[${beige200}] ring-[${beige300}] text-[${textDeep}]`
  }

  // Derived counts (use normalized status)
  const countPending  = bookings.filter(b => statusOf(b) === "pending").length
  const countAccepted = bookings.filter(b => statusOf(b) === "accepted").length
  const countRejected = bookings.filter(b => statusOf(b) === "rejected").length

  // Filtered view for current tab (use normalized status)
  const filtered = bookings.filter(b => statusOf(b) === activeTab)

  // Load current user
  useEffect(() => {
    const loadUser = () => {
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
    }
    loadUser()
  }, [])

  // Load booking requests when user is available
  useEffect(() => {
    if (currentUser && currentUser.role === 'tutor') {
      loadBookingRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  // Reload data when tab changes (only after first load)
  useEffect(() => {
    if (currentUser && currentUser.role === 'tutor' && !loading) {
      loadBookingRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const loadBookingRequests = async () => {
    if (!currentUser) return
    setLoading(true)
    setError(null)

    try {
      const requests = await getTutorBookingRequests(currentUser.uid)

      // ---------- NEW: normalize statuses on read ----------
      const normalized = requests.map(r => ({
        ...r,
        status: normalizeStatus((r as any).status),
      })) as BookingRequest[]

      setBookings(normalized)
    } catch (err: any) {
      console.error('Error loading booking requests:', err)
      setError(err?.message || 'Failed to load booking requests')
    } finally {
      setLoading(false)
    }
  }

  const handleBookingAction = async (bookingId: string, action: "accept" | "reject") => {
    try {
      let sessionId: string | undefined
      let request: BookingRequest | undefined

      // Find the request first (needed for both accept and reject)
      request = bookings.find(b => (b as any).id === bookingId)
      if (!request && currentUser) {
        const allRequests = await getTutorBookingRequests(currentUser.uid)
        request = allRequests.find(r => (r as any).id === bookingId) as BookingRequest | undefined
      }
      if (!request) {
        setError('Request not found')
        return
      }

      if (action === "accept") {
        // convert to session
        const sessionResult = await convertRequestToSession(request)
        if (!sessionResult.success) {
          setError(sessionResult.error || 'Failed to create session from request')
          return
        }
        sessionId = sessionResult.sessionId
        console.log(`Session created and added to both student and tutor calendars`)
      } else if (action === "reject") {
        // Refund tokens to student when rejecting
        const refundResult = await refundTokens(
          request.studentId, 
          request.cost, 
          `Booking request rejected for ${request.subject}`
        )
        
        if (!refundResult.success) {
          console.error('Failed to refund tokens:', refundResult.error)
          // Continue with rejection even if refund fails
          setError(`Request rejected but failed to refund tokens: ${refundResult.error}`)
        } else {
          console.log(`Successfully refunded ${request.cost} tokens to student ${request.studentId}`)
          // Show success message for refund
          setError(null) // Clear any previous errors
        }
      }

      // Persist status change
      const updateResult = await updateBookingRequestStatus(bookingId, action === "accept" ? "accepted" : "rejected", sessionId)
      if (!updateResult.success) {
        setError(updateResult.error || `Failed to ${action} booking request`)
        return
      }

      // ---------- NEW: optimistic local update ----------
      setBookings(prev =>
        prev.map(b =>
          (b as any).id === bookingId
            ? ({
                ...b,
                status: action === "accept" ? ("accepted" as any) : ("rejected" as any),
                sessionId: sessionId ?? (b as any).sessionId,
              } as BookingRequest)
            : b
        )
      )
      if (action === "accept") {
        setActiveTab("accepted")
        console.log("✅ Session accepted and added to tutor schedule calendar")
      }

      // Optional: sync with DB after a short delay
      await new Promise(r => setTimeout(r, 300))
      await loadBookingRequests()
    } catch (err: any) {
      console.error(`Error ${action}ing booking request:`, err)
      setError(err?.message || `Failed to ${action} booking request`)
    }
  }

  return (
    <motion.main className="mx-auto w-full max-w-7xl px-6 py-10" variants={containerVariants} initial="hidden" animate="visible">
      {/* header */}
      <motion.div className="mb-8" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">Booking Requests</h1>
            <p className="text-neutral-600">Manage your tutoring session bookings and requests from students.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadBookingRequests} disabled={loading || !currentUser} className="flex items-center space-x-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            
          </div>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div className="mb-6" variants={itemVariants}>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="text-red-600 font-medium">Error loading booking requests</div>
              <div className="text-red-500 text-sm mt-1">{error}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <motion.div className="mb-8" variants={itemVariants}>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading booking requests...</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No user */}
      {!currentUser && !loading && (
        <motion.div className="mb-8" variants={itemVariants}>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-neutral-600">Please sign in to view booking requests</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div className="grid gap-4 md:grid-cols-3 mb-8" variants={containerVariants}>
        {[
          { icon: <Clock className="h-6 w-6" />, label: "Pending Requests", count: countPending },
          { icon: <CheckCircle className="h-6 w-6" />, label: "Accepted Sessions", count: countAccepted },
          { icon: <Users className="h-6 w-6" />, label: "Total Bookings", count: bookings.length },
        ].map((s, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="rounded-2xl border-0 bg-[#fdfaf6] shadow-sm transition-transform hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-3 bg-[#f3e9dd] text-[#7a6a57]">{s.icon}</div>
                  <div>
                    <p className="text-sm text-neutral-600">{s.label}</p>
                    <p className="text-2xl font-semibold text-neutral-900">{s.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main */}
      {currentUser && !loading && (
        <motion.div variants={itemVariants}>
          <Card className="rounded-3xl border-0 bg-[#fdfaf6] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-neutral-900">Booking Management</CardTitle>
              <CardDescription className="text-neutral-600">Review and manage student booking requests</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                {/* colored triggers */}
                <TabsList className="grid w-full grid-cols-3 rounded-xl p-1 bg-[#f3e9dd]">
                  <TabsTrigger
                    value="pending"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm
                               data-[state=active]:text-[color:var(--amber)] hover:bg-white/50"
                    style={{ ['--amber' as any]: amber } as React.CSSProperties}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="font-medium" style={{ color: activeTab === "pending" ? amber : undefined }}>
                      Pending ({countPending})
                    </span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="accepted"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm hover:bg-white/50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="font-medium" style={{ color: activeTab === "accepted" ? olive : undefined }}>
                      Accepted ({countAccepted})
                    </span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="rejected"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm hover:bg-white/50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    <span className="font-medium" style={{ color: activeTab === "rejected" ? terra : undefined }}>
                      Rejected ({countRejected})
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                  <div className="space-y-4">
                    {filtered.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-[#f3e9dd]">
                          {activeTab === "pending" && <Clock className="h-8 w-8 text-[#7a6a57]" />}
                          {activeTab === "accepted" && <CheckCircle className="h-8 w-8 text-[#7a6a57]" />}
                          {activeTab === "rejected" && <XCircle className="h-8 w-8 text-[#7a6a57]" />}
                        </div>
                        <h3 className="text-neutral-700 font-medium">No {activeTab} bookings</h3>
                        <p className="text-sm text-neutral-500 mt-1">Nothing here yet.</p>
                      </div>
                    ) : (
                      filtered.map(booking => {
                        const normStatus = statusOf(booking) as "pending" | "accepted" | "rejected"
                        return (
                          <motion.div
                            key={(booking as any).id}
                            variants={cardHoverVariants}
                            whileHover="hover"
                            className="rounded-2xl p-6 bg-white ring-1 ring-[#e9ddd0] hover:ring-[#d9ccbe] transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                                  <AvatarImage src={(booking as any).studentAvatar} alt={(booking as any).studentName} />
                                  <AvatarFallback>
                                    {(booking as any).studentName?.split(" ").map((n: string) => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-lg text-neutral-900">{(booking as any).studentName}</h3>
                                    <Badge variant="secondary" className={getStatusChip(normStatus)}>
                                      {normStatus.charAt(0).toUpperCase() + normStatus.slice(1)}
                                    </Badge>
                                    {(booking as any).urgency && (
                                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5 ring-1 bg-[#f6efe5] ring-[#e9ddd0] text-[#5a4e42]">
                                        {((booking as any).urgency as string).charAt(0).toUpperCase() + ((booking as any).urgency as string).slice(1)} Priority
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div className="space-y-1">
                                      <p className="text-sm text-neutral-500">Subject</p>
                                      <p className="font-medium text-neutral-900 flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-neutral-500" />
                                        {(booking as any).subject}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-neutral-500">Topic</p>
                                      <p className="font-medium text-neutral-900">{(booking as any).topic}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-neutral-500">Date &amp; Time</p>
                                      <p className="font-medium text-neutral-900 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-neutral-500" />
                                        {new Date((booking as any).date).toLocaleDateString()} at {(booking as any).time}
                                      </p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-neutral-500">Duration</p>
                                      <p className="font-medium text-neutral-900 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-neutral-500" />
                                        {(booking as any).duration} minutes
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm font-medium text-neutral-900">Cost: {(booking as any).cost} tokens</span>
                                    {normStatus === "accepted" && (booking as any).sessionId && (
                                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                        Session ID: {(booking as any).sessionId}
                                      </span>
                                    )}
                                  </div>

                                  {(booking as any).message && (
                                    <div className="rounded-lg p-3 bg-[#fdfaf6] ring-1 ring-[#efe5d9]">
                                      <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="h-4 w-4 text-neutral-500" />
                                        <span className="text-sm font-medium text-neutral-800">Student Message</span>
                                      </div>
                                      <p className="text-sm text-neutral-700">{(booking as any).message}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* actions */}
                              {normStatus === "pending" && (
                                <div className="flex flex-col sm:flex-row gap-2 ml-4">
                                  <Button
                                    onClick={() => handleBookingAction((booking as any).id, "accept")}
                                    className="rounded-xl bg-[color:var(--olive)] hover:opacity-90 text-white"
                                    style={{ ['--olive' as any]: olive } as React.CSSProperties}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Accept
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleBookingAction((booking as any).id, "reject")}
                                    className="rounded-xl border-[color:var(--terra)] text-[color:var(--terra)] hover:bg-[color:var(--terra)]/10"
                                    style={{ ['--terra' as any]: terra } as React.CSSProperties}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {normStatus === "accepted" && (
                                <div className="flex flex-col gap-2 ml-4">
                                  <Button className="rounded-xl bg-[color:var(--olive)] hover:opacity-90 text-white"
                                          style={{ ['--olive' as any]: olive } as React.CSSProperties}>
                                    <Video className="h-4 w-4 mr-2" />
                                    Start Session
                                  </Button>
                                  <Button variant="outline" size="sm" className="rounded-xl border-[#e6d9c8] hover:bg-[#efe6d8]">
                                    Reschedule
                                  </Button>
                                  {(booking as any).sessionId && (
                                    <div className="text-xs text-neutral-500 text-center">
                                      Session: {(booking as any).sessionId?.slice(0, 8)}...
                                    </div>
                                  )}
                                </div>
                              )}

                              {normStatus === "rejected" && (
                                <div className="ml-4">
                                  <Button variant="outline" size="sm"
                                    className="rounded-xl border-[color:var(--terra)] text-[color:var(--terra)] hover:bg-[color:var(--terra)]/10"
                                    style={{ ['--terra' as any]: terra } as React.CSSProperties}
                                  >
                                    Reconsider
                                  </Button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.main>
  )
}
