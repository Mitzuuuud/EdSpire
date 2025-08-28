"use client"

import { Navbar } from "@/components/navbar"
import { ChatAssistant } from "@/components/chat-assistant"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Sparkles, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

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
      ease: "easeOut",
    },
  },
}

export default function AIPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.main className="mx-auto w-full max-w-7xl px-6 py-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">AI Study Assistant</h1>
          </div>
          <p className="text-muted-foreground">Get personalized help with your studies</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Chat Assistant - Takes up 3 columns */}
          <motion.div className="lg:col-span-3" variants={itemVariants}>
            <div className="h-[600px]">
              <ChatAssistant />
            </div>
          </motion.div>

          {/* Sidebar with tips and stats */}
          <motion.div className="space-y-6" variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Quick Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium mb-1">Study Planning</p>
                  <p className="text-xs text-muted-foreground">
                    Ask me to create a personalized study schedule based on your courses and goals.
                  </p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium mb-1">Tutor Matching</p>
                  <p className="text-xs text-muted-foreground">
                    I can help you find the perfect tutor based on subject, availability, and budget.
                  </p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium mb-1">Progress Tracking</p>
                  <p className="text-xs text-muted-foreground">
                    Get insights on your learning progress and areas for improvement.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Your Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Questions Asked</span>
                  <span className="font-medium">47</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Study Plans Created</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tutors Recommended</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sessions Booked</span>
                  <span className="font-medium">8</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
