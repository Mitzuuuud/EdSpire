"use client"

import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, Users, Video, MessageSquare, TrendingUp, Award, Target } from "lucide-react"
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

export default function Dashboard() {
  const router = useRouter()

  const handleJoinSession = () => {
    router.push("/video")
  }

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
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Welcome back, Alex</h1>
          <p className="text-muted-foreground">Ready to continue your learning journey?</p>
        </motion.div>

        <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" variants={containerVariants}>
          {/* Next Session Card */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover="hover" variants={cardHoverVariants}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[300px] flex flex-col leading-3">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Next Session</CardTitle>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">Advanced Calculus</p>
                      <p className="text-sm text-muted-foreground">with Dr. Sarah Chen</p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Today, 3:00 PM - 4:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Starting in 2h
                      </Badge>
                    </div>
                  </div>
                  <Button className="w-full mt-4" size="sm" onClick={handleJoinSession}>
                    Join Session
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Progress Card */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover="hover" variants={cardHoverVariants}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[300px] flex flex-col leading-7 flex flex-col leading-7">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Progress</CardTitle>
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="hover:shadow-lg transition-shadow duration-200 rounded-2xl flex flex-col leading-7">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Calculus</span>
                        <span className="font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Physics</span>
                        <span className="font-medium">72%</span>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Chemistry</span>
                        <span className="font-medium">91%</span>
                      </div>
                      <Progress value={91} className="h-2" />
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Overall Progress</span>
                        <span className="font-medium text-primary">83%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Tasks Card */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover="hover" variants={cardHoverVariants}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[300px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                      3 due
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Calculus Problem Set 7</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                        Due Tomorrow
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Physics Lab Report</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-yellow-200 text-yellow-700">
                        Due Friday
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Chemistry Quiz Prep</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                        Due Monday
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                      View All Tasks
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Study Stats Card */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover="hover" variants={cardHoverVariants}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[300px]">
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
                      <span className="font-medium">12.5h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sessions Completed</span>
                      <span className="font-medium">8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tasks Completed</span>
                      <span className="font-medium">15</span>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Weekly Goal</span>
                        <span className="text-sm font-medium text-primary">83% Complete</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Recent Activity Card */}
          <motion.div variants={itemVariants}>
            <motion.div whileHover="hover" variants={cardHoverVariants}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[300px]">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">Completed Physics session with Dr. Johnson</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">Submitted Calculus homework</p>
                        <p className="text-xs text-muted-foreground">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">Booked session with Dr. Chen</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Quick Actions Card */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
            <motion.div whileHover="hover" variants={cardHoverVariants}>
              <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Get started with common tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent w-full">
                        <Users className="h-6 w-6" />
                        <span>Find Tutor</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent w-full">
                        <Calendar className="h-6 w-6" />
                        <span>Book Session</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent w-full">
                        <Video className="h-6 w-6" />
                        <span>Start Video Call</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" className="h-20 flex-col space-y-2 bg-transparent w-full">
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
