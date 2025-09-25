"use client"

// Moving existing tutor dashboard code to new location
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
} from "lucide-react"
import { motion } from "framer-motion"

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

  const handleStartSession = () => {
    router.push("/tutor/video")
  }

  return (
    <motion.main
      className="mx-auto w-full max-w-7xl px-6 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div className="mb-8" variants={itemVariants}>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Welcome back, Dr. Chen!</h1>
        <p className="text-muted-foreground">Here's an overview of your tutoring activities and upcoming sessions.</p>
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
                <span className="text-2xl font-bold">24</span>
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
                <span className="text-2xl font-bold">156</span>
                <Clock className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rating */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">4.9</span>
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Earnings */}
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">2,450</span>
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">EdS</span>
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
                  {/* Session 1 */}
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Video className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Advanced Calculus with Alex</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Today, 2:00 PM</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleStartSession}>Start</Button>
                  </div>

                  {/* Session 2 */}
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Video className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Linear Algebra with Sarah</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Today, 4:00 PM</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled>Pending</Button>
                  </div>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Alex Johnson</span>
                    <Badge variant="secondary">Calculus</Badge>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground">Derivatives mastery: 85%</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sarah Smith</span>
                    <Badge variant="secondary">Linear Algebra</Badge>
                  </div>
                  <Progress value={92} className="h-2" />
                  <p className="text-xs text-muted-foreground">Matrix operations: 92%</p>
                </div>
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
  )
}
