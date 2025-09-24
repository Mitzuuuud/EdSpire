"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown, ArrowUpRight, Users, Star, Trophy, Filter, Medal, Activity, Target, Zap, Award, TrendingUp } from "lucide-react"
import { motion, Variants, useAnimation, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
      ease: "easeOut",
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

const rankCardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  hover: {
    y: -5,
    transition: { duration: 0.2 }
  }
}

// Types
type LeaderRow = {
  id: string
  name: string
  role: "Tutor" | "Student"
  subject?: string
  sessions: number
  rating?: number
  edsEarned: number
  avatar: string
  level: number
  achievements: string[]
}

// Static data with gamification elements
const mockLeaders: LeaderRow[] = [
  {
    id: "t1",
    name: "Dr. Sarah Chen",
    role: "Tutor",
    subject: "Mathematics",
    sessions: 128,
    rating: 4.9,
    edsEarned: 2140,
    avatar: "/professional-woman-tutor.png",
    level: 15,
    achievements: ["Master Tutor", "Session Expert", "Student Favorite"],
  },
  {
    id: "t2",
    name: "Prof. Emily Davis",
    role: "Tutor",
    subject: "Chemistry",
    sessions: 92,
    rating: 4.8,
    edsEarned: 1760,
    avatar: "/professional-woman-chemistry-tutor.png",
    level: 12,
    achievements: ["Rising Star", "Chemistry Ace"],
  },
  {
    id: "s1",
    name: "Alex Rivera",
    role: "Student",
    sessions: 44,
    edsEarned: 640,
    avatar: "/young-man-math-tutor.png",
    level: 8,
    achievements: ["Quick Learner", "Regular"],
  },
  {
    id: "t3",
    name: "Dr. Mike Johnson",
    role: "Tutor",
    subject: "Physics",
    sessions: 101,
    rating: 4.7,
    edsEarned: 1685,
    avatar: "/professional-man-physics-tutor.png",
    level: 11,
    achievements: ["Physics Pro", "Dedicated Tutor"],
  },
  {
    id: "s2",
    name: "Priya Nair",
    role: "Student",
    sessions: 51,
    edsEarned: 720,
    avatar: "/professional-woman-tutor.png",
    level: 7,
    achievements: ["Active Learner"],
  },
  {
    id: "s3",
    name: "Kenji Sato",
    role: "Student",
    sessions: 39,
    edsEarned: 505,
    avatar: "/professional-man-computer-science-tutor.png",
    level: 6,
    achievements: ["Newcomer"],
  }
]

// Current user data (you can replace this with actual user data)
const currentUser = {
  name: "You",
  role: "Student" as const,
  rank: 8,
  edsEarned: 420,
  sessions: 12,
  level: 4
}

export default function Page() {
  const [roleFilter, setRoleFilter] = useState<"all" | "Tutor" | "Student">("all")
  const [sortBy, setSortBy] = useState<"eds" | "sessions" | "rating">("eds")

  const controls = useAnimation()

  useEffect(() => {
    controls.start("visible")
  }, [controls])

  const filtered = useMemo(() => {
    let rows = [...mockLeaders]
    if (roleFilter !== "all") rows = rows.filter((r) => r.role === roleFilter)
    rows.sort((a, b) => {
      if (sortBy === "eds") return b.edsEarned - a.edsEarned
      if (sortBy === "sessions") return b.sessions - a.sessions
      const ar = a.rating ?? 0
      const br = b.rating ?? 0
      return br - ar
    })
    return rows
  }, [roleFilter, sortBy])

  const top3 = filtered.slice(0, 3)

  const getPodiumIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return null
    }
  }

  const getPodiumBgColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-b from-yellow-50 to-yellow-100 border-yellow-200"
      case 1:
        return "bg-gradient-to-b from-gray-50 to-gray-100 border-gray-200"
      case 2:
        return "bg-gradient-to-b from-amber-50 to-amber-100 border-amber-200"
      default:
        return "bg-white"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <Navbar />
      <motion.main
        className="mx-auto w-full max-w-7xl px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        {/* Header */}
        <motion.div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">Top performers ranked by EDS earned</p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Active Users", value: "246" },
              { icon: Activity, label: "Total Sessions", value: "1,284" },
              { icon: Star, label: "Avg Rating", value: "4.8" },
              { icon: Zap, label: "EDS Earned", value: "12,450" },
            ].map((stat, i) => (
              <Card key={i} className="border-0 bg-white backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <stat.icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div className="mb-8 flex flex-wrap items-center gap-3" variants={itemVariants}>
          <Badge variant="secondary" className="gap-1">
            <Filter className="h-3.5 w-3.5" /> Filters
          </Badge>
          <Select value={roleFilter} onValueChange={(v: "all" | "Tutor" | "Student") => setRoleFilter(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Tutor">Tutors</SelectItem>
              <SelectItem value="Student">Students</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: "eds" | "sessions" | "rating") => setSortBy(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eds">EDS Earned</SelectItem>
              <SelectItem value="sessions">Sessions</SelectItem>
              <SelectItem value="rating">Rating (Tutors)</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Top 3 Podium - Photo Style */}
        <motion.div className="mb-12" variants={itemVariants}>
          <div className="flex justify-center items-end gap-4 max-w-4xl mx-auto">
            {/* 2nd Place */}
            {top3[1] && (
              <motion.div
                className={cn(
                  "rounded-2xl p-6 text-center border-2 w-72",
                  getPodiumBgColor(1)
                )}
                variants={rankCardVariants}
                whileHover="hover"
              >
                <div className="flex justify-center mb-4">
                  {getPodiumIcon(1)}
                </div>
                <div className="relative mx-auto mb-4 h-16 w-16">
                  <img
                    src={top3[1].avatar}
                    alt={top3[1].name}
                    className="h-full w-full rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-500 text-xs font-bold text-white">
                    {top3[1].level}
                  </div>
                </div>
                <h3 className="mb-1 font-bold text-gray-700">{top3[1].name}</h3>
                <p className="mb-3 text-sm text-gray-600">
                  {top3[1].role} • {top3[1].subject}
                </p>
                <div className="text-2xl font-bold text-gray-600 mb-2">
                  {top3[1].edsEarned} EDS
                </div>
              </motion.div>
            )}

            {/* 1st Place - Taller */}
            {top3[0] && (
              <motion.div
                className={cn(
                  "rounded-2xl p-8 text-center border-2 w-80 relative",
                  getPodiumBgColor(0)
                )}
                style={{ marginTop: '-2rem' }}
                variants={rankCardVariants}
                whileHover="hover"
              >
                <div className="flex justify-center mb-4">
                  {getPodiumIcon(0)}
                </div>
                <div className="relative mx-auto mb-4 h-20 w-20">
                  <img
                    src={top3[0].avatar}
                    alt={top3[0].name}
                    className="h-full w-full rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500 text-sm font-bold text-white">
                    {top3[0].level}
                  </div>
                </div>
                <h3 className="mb-1 font-bold text-gray-800 text-lg">{top3[0].name}</h3>
                <p className="mb-4 text-sm text-gray-600">
                  {top3[0].role} • {top3[0].subject}
                </p>
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {top3[0].edsEarned} EDS
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <motion.div
                className={cn(
                  "rounded-2xl p-6 text-center border-2 w-72",
                  getPodiumBgColor(2)
                )}
                variants={rankCardVariants}
                whileHover="hover"
              >
                <div className="flex justify-center mb-4">
                  {getPodiumIcon(2)}
                </div>
                <div className="relative mx-auto mb-4 h-16 w-16">
                  <img
                    src={top3[2].avatar}
                    alt={top3[2].name}
                    className="h-full w-full rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                    {top3[2].level}
                  </div>
                </div>
                <h3 className="mb-1 font-bold text-gray-700">{top3[2].name}</h3>
                <p className="mb-3 text-sm text-gray-600">
                  {top3[2].role} • {top3[2].subject}
                </p>
                <div className="text-2xl font-bold text-amber-600 mb-2">
                  {top3[2].edsEarned} EDS
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Your Ranking Status */}
        <motion.div variants={itemVariants} className="mb-8">
          <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Your Ranking Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">#{currentUser.rank}</div>
                  <div className="text-sm text-muted-foreground">Global Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{currentUser.edsEarned}</div>
                  <div className="text-sm text-muted-foreground">EDS Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{currentUser.sessions}</div>
                  <div className="text-sm text-muted-foreground">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">Level {currentUser.level}</div>
                  <div className="text-sm text-muted-foreground">Current Level</div>
                </div>
              </div>
              <div className="text-center pt-2">
                <Badge variant="secondary" className="bg-primary/10">
                  {currentUser.role}
                </Badge>
              </div>

              {/* Weekly Progress Section */}
              <div className="border-t pt-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Weekly Progress</h3>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Top 10</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      10 hours of tutor to go to reach top 10
                    </p>
                  </div>
                </div>

                {/* Mini-challenges Section */}
                <div className="bg-white/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Mini-challenges
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm">Complete 3 tutoring sessions within a week</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-primary">5</span>
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className="text-xs text-muted-foreground">EDS</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm">Schedule 4 self-study sessions</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-primary">4</span>
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className="text-xs text-muted-foreground">EDS</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm">Generate learning pathway for 1 subject</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-primary">3</span>
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className="text-xs text-muted-foreground">EDS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Global Rankings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 px-6 text-sm font-medium text-gray-500">Rank</th>
                      <th className="py-3 px-6 text-sm font-medium text-gray-500">Name</th>
                      <th className="py-3 px-6 text-sm font-medium text-gray-500">Role</th>
                      <th className="py-3 px-6 text-sm font-medium text-gray-500">Subject</th>
                      <th className="py-3 px-6 text-sm font-medium text-gray-500">Sessions</th>
                      <th className="py-3 px-6 text-sm font-medium text-gray-500">Rating</th>
                      <th className="py-3 px-6 text-sm font-medium text-gray-500">EDS</th>
                      <th className="py-3 px-6 text-sm font-medium text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-gray-50 hover:bg-gray-50 transition-colors",
                          idx < 3 && "bg-gray-50/50"
                        )}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">#{idx + 1}</span>
                            {idx === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                            {idx === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                            {idx === 2 && <Award className="h-4 w-4 text-amber-600" />}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img src={row.avatar} alt={row.name} className="h-8 w-8 rounded-full object-cover" />
                            <span className="font-medium text-gray-900">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-700">{row.role}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-700">{row.role === "Tutor" ? row.subject : "-"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-900 font-medium">{row.sessions}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-gray-900 font-medium">{row.role === "Tutor" ? row.rating?.toFixed(1) : "-"}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                            <span className="font-semibold text-gray-900">{row.edsEarned}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Button 
                            asChild 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-gray-600 hover:text-gray-900"
                          >
                            <Link href={`/profile?id=${row.id}`} className="inline-flex items-center text-sm">
                              View <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  )
}