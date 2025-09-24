"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, CheckCircle, XCircle, MessageSquare, Video, BookOpen, Star } from "lucide-react"
import { motion } from "framer-motion"

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

interface Booking {
  id: string
  studentName: string
  studentEmail: string
  studentAvatar?: string
  subject: string
  topic: string
  date: string
  time: string
  duration: number
  message?: string
  status: "pending" | "accepted" | "rejected"
  studentRating?: number
  urgency?: "low" | "medium" | "high"
}

const mockBookings: Booking[] = [
  {
    id: "1",
    studentName: "Alex Johnson",
    studentEmail: "alex.johnson@email.com",
    subject: "Advanced Calculus",
    topic: "Integration Techniques",
    date: "2024-01-15",
    time: "14:00",
    duration: 60,
    message: "I need help with definite integrals and the fundamental theorem of calculus.",
    status: "pending",
    urgency: "high",
    studentRating: 4.8,
  },
  {
    id: "2",
    studentName: "Sarah Smith",
    studentEmail: "sarah.smith@email.com",
    subject: "Linear Algebra",
    topic: "Matrix Operations",
    date: "2024-01-16",
    time: "10:00",
    duration: 45,
    message: "Struggling with eigenvalues and eigenvectors. Could use some guidance.",
    status: "pending",
    urgency: "medium",
    studentRating: 4.6,
  },
  {
    id: "3",
    studentName: "Mike Chen",
    studentEmail: "mike.chen@email.com",
    subject: "Statistics",
    topic: "Hypothesis Testing",
    date: "2024-01-14",
    time: "16:00",
    duration: 90,
    message: "Need help understanding p-values and confidence intervals.",
    status: "accepted",
    urgency: "low",
    studentRating: 4.9,
  },
  {
    id: "4",
    studentName: "Emma Wilson",
    studentEmail: "emma.wilson@email.com",
    subject: "Calculus",
    topic: "Derivatives",
    date: "2024-01-13",
    time: "11:00",
    duration: 60,
    message: "Having trouble with the chain rule and implicit differentiation.",
    status: "rejected",
    urgency: "medium",
    studentRating: 4.7,
  },
]

export default function TutorBookings() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings)
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected">("pending")

  const handleBookingAction = (bookingId: string, action: "accept" | "reject") => {
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: action === "accept" ? "accepted" : "rejected" } : b)),
    )
  }

  // theme colors (warm + readable)
  const beige100 = "#fdfaf6"
  const beige200 = "#f3e9dd"
  const beige300 = "#e9dfd1"
  const textDeep = "#4a4033"
  const olive = "#5f7c57"       // accepted
  const amber = "#b4843b"       // pending
  const terra = "#b35c44"       // rejected

  const getStatusChip = (status: Booking["status"]) => {
    const base = "rounded-full px-2.5 py-0.5 ring-1 text-[12px] font-medium"
    if (status === "pending") return `${base} bg-[${beige200}] ring-[${beige300}] text-[${textDeep}]`
    if (status === "accepted") return `${base} bg-[${beige200}] ring-[${beige300}] text-[${textDeep}]`
    return `${base} bg-[${beige200}] ring-[${beige300}] text-[${textDeep}]`
  }

  const filtered = bookings.filter(b => b.status === activeTab)

  return (
    // removed outside container background (transparent now)
    <motion.main className="mx-auto w-full max-w-7xl px-6 py-10"
      variants={containerVariants} initial="hidden" animate="visible"
    >
      {/* header */}
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">Booking Requests</h1>
        <p className="text-neutral-600">Manage your tutoring session bookings and requests from students.</p>
      </motion.div>

      {/* stats */}
      <motion.div className="grid gap-4 md:grid-cols-3 mb-8" variants={containerVariants}>
        {[
          { icon: <Clock className="h-6 w-6" />, label: "Pending Requests", count: bookings.filter(b => b.status === "pending").length },
          { icon: <CheckCircle className="h-6 w-6" />, label: "Accepted Sessions", count: bookings.filter(b => b.status === "accepted").length },
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

      {/* main */}
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
                  <span className="font-medium"
                        style={{ color: activeTab === "pending" ? amber : undefined }}>
                    Pending ({bookings.filter(b => b.status === "pending").length})
                  </span>
                </TabsTrigger>

                <TabsTrigger
                  value="accepted"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm hover:bg-white/50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium"
                        style={{ color: activeTab === "accepted" ? olive : undefined }}>
                    Accepted ({bookings.filter(b => b.status === "accepted").length})
                  </span>
                </TabsTrigger>

                <TabsTrigger
                  value="rejected"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm hover:bg-white/50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium"
                        style={{ color: activeTab === "rejected" ? terra : undefined }}>
                    Rejected ({bookings.filter(b => b.status === "rejected").length})
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
                    filtered.map(booking => (
                      <motion.div
                        key={booking.id}
                        variants={cardHoverVariants}
                        whileHover="hover"
                        className="rounded-2xl p-6 bg-white ring-1 ring-[#e9ddd0] hover:ring-[#d9ccbe] transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                              <AvatarImage src={booking.studentAvatar} alt={booking.studentName} />
                              <AvatarFallback>
                                {booking.studentName.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg text-neutral-900">{booking.studentName}</h3>
                                <Badge variant="secondary" className={getStatusChip(booking.status)}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </Badge>
                                {booking.urgency && (
                                  <Badge variant="outline" className="rounded-full px-2.5 py-0.5 ring-1 bg-[#f6efe5] ring-[#e9ddd0] text-[#5a4e42]">
                                    {booking.urgency.charAt(0).toUpperCase() + booking.urgency.slice(1)} Priority
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div className="space-y-1">
                                  <p className="text-sm text-neutral-500">Subject</p>
                                  <p className="font-medium text-neutral-900 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-neutral-500" />
                                    {booking.subject}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-neutral-500">Topic</p>
                                  <p className="font-medium text-neutral-900">{booking.topic}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-neutral-500">Date &amp; Time</p>
                                  <p className="font-medium text-neutral-900 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-neutral-500" />
                                    {new Date(booking.date).toLocaleDateString()} at {booking.time}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm text-neutral-500">Duration</p>
                                  <p className="font-medium text-neutral-900 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-neutral-500" />
                                    {booking.duration} minutes
                                  </p>
                                </div>
                              </div>

                              {booking.studentRating && (
                                <div className="flex items-center gap-2 mb-3">
                                  <Star className="h-4 w-4 text-[#c4a46a] fill-[#d9bf86]" />
                                  <span className="text-sm font-medium text-neutral-900">{booking.studentRating}</span>
                                  <span className="text-sm text-neutral-500">student rating</span>
                                </div>
                              )}

                              {booking.message && (
                                <div className="rounded-lg p-3 bg-[#fdfaf6] ring-1 ring-[#efe5d9]">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-neutral-500" />
                                    <span className="text-sm font-medium text-neutral-800">Student Message</span>
                                  </div>
                                  <p className="text-sm text-neutral-700">{booking.message}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* actions with color */}
                          {booking.status === "pending" && (
                            <div className="flex flex-col sm:flex-row gap-2 ml-4">
                              <Button
                                onClick={() => handleBookingAction(booking.id, "accept")}
                                className="rounded-xl bg-[color:var(--olive)] hover:opacity-90 text-white"
                                style={{ ['--olive' as any]: olive } as React.CSSProperties}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleBookingAction(booking.id, "reject")}
                                className="rounded-xl border-[color:var(--terra)] text-[color:var(--terra)] hover:bg-[color:var(--terra)]/10"
                                style={{ ['--terra' as any]: terra } as React.CSSProperties}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {booking.status === "accepted" && (
                            <div className="flex flex-col gap-2 ml-4">
                              <Button className="rounded-xl bg-[color:var(--olive)] hover:opacity-90 text-white"
                                      style={{ ['--olive' as any]: olive } as React.CSSProperties}>
                                <Video className="h-4 w-4 mr-2" />
                                Start Session
                              </Button>
                              <Button variant="outline" size="sm" className="rounded-xl border-[#e6d9c8] hover:bg-[#efe6d8]">
                                Reschedule
                              </Button>
                            </div>
                          )}

                          {booking.status === "rejected" && (
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
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </motion.main>
  )
}
