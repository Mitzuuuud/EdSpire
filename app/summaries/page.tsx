"use client"

import { Navbar } from "@/components/navbar"
import { SummaryCard } from "@/components/summary-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, FileText, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

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

const summaries = [
  {
    id: "1",
    title: "Advanced Calculus - Derivatives Deep Dive",
    tutor: "Dr. Sarah Chen",
    date: "Today",
    duration: "1h 15m",
    subject: "Mathematics",
    tldr: [
      "Covered the fundamental rules of differentiation including power, product, and chain rules",
      "Worked through 5 complex derivative problems with step-by-step solutions",
      "Discussed real-world applications of derivatives in physics and economics",
      "Identified key areas for improvement in algebraic manipulation",
    ],
    actionItems: [
      {
        id: "1",
        task: "Complete practice problems 1-15 from Chapter 3",
        completed: false,
        linkedToPlan: true,
      },
      {
        id: "2",
        task: "Review chain rule examples and create summary notes",
        completed: true,
        linkedToPlan: true,
      },
      {
        id: "3",
        task: "Schedule follow-up session for integration techniques",
        completed: false,
        linkedToPlan: false,
      },
    ],
    transcript: [
      {
        speaker: "Dr. Sarah Chen",
        timestamp: "00:02",
        text: "Welcome back, Alex! Today we're going to dive deep into derivatives. Are you ready?",
      },
      {
        speaker: "Alex",
        timestamp: "00:05",
        text: "Yes, I'm excited to learn! I've been struggling with the chain rule.",
      },
      {
        speaker: "Dr. Sarah Chen",
        timestamp: "00:08",
        text: "Perfect! Let's start with the basics and work our way up to the chain rule. Remember, the derivative represents the rate of change...",
      },
    ],
    keyTopics: ["Power Rule", "Product Rule", "Chain Rule", "Implicit Differentiation", "Applications"],
    rating: 5,
  },
  {
    id: "2",
    title: "Quantum Physics - Wave-Particle Duality",
    tutor: "Dr. Mike Johnson",
    date: "Yesterday",
    duration: "1h 30m",
    subject: "Physics",
    tldr: [
      "Explored the historical development of quantum mechanics from Planck to Heisenberg",
      "Analyzed the double-slit experiment and its implications for quantum theory",
      "Discussed wave functions and probability distributions in quantum systems",
      "Connected quantum concepts to modern technology applications",
    ],
    actionItems: [
      {
        id: "4",
        task: "Read Chapter 12 on quantum mechanics fundamentals",
        completed: true,
        linkedToPlan: true,
      },
      {
        id: "5",
        task: "Solve practice problems on wave-particle duality",
        completed: false,
        linkedToPlan: true,
      },
      {
        id: "6",
        task: "Research modern applications of quantum physics",
        completed: false,
        linkedToPlan: false,
      },
    ],
    transcript: [
      {
        speaker: "Dr. Mike Johnson",
        timestamp: "00:01",
        text: "Today we're exploring one of the most fascinating concepts in physics - wave-particle duality.",
      },
      {
        speaker: "Alex",
        timestamp: "00:04",
        text: "I find it hard to understand how something can be both a wave and a particle.",
      },
    ],
    keyTopics: ["Double-Slit Experiment", "Wave Functions", "Heisenberg Principle", "Quantum Superposition"],
    rating: 5,
  },
  {
    id: "3",
    title: "Organic Chemistry - Reaction Mechanisms",
    tutor: "Prof. Emily Davis",
    date: "2 days ago",
    duration: "1h 00m",
    subject: "Chemistry",
    tldr: [
      "Studied nucleophilic substitution reactions (SN1 and SN2 mechanisms)",
      "Analyzed factors affecting reaction rates and selectivity",
      "Practiced drawing reaction mechanisms with proper arrow notation",
      "Discussed stereochemistry implications in organic reactions",
    ],
    actionItems: [
      {
        id: "7",
        task: "Complete mechanism practice worksheet",
        completed: true,
        linkedToPlan: true,
      },
      {
        id: "8",
        task: "Review stereochemistry concepts",
        completed: true,
        linkedToPlan: true,
      },
      {
        id: "9",
        task: "Prepare for upcoming organic chemistry exam",
        completed: false,
        linkedToPlan: true,
      },
    ],
    transcript: [
      {
        speaker: "Prof. Emily Davis",
        timestamp: "00:02",
        text: "Let's start by reviewing the SN2 mechanism. Can you tell me what makes this reaction favorable?",
      },
    ],
    keyTopics: ["SN1 Mechanism", "SN2 Mechanism", "Stereochemistry", "Reaction Kinetics"],
    rating: 4,
  },
]

export default function SummariesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  const filteredSummaries = summaries.filter((summary) => {
    const matchesSearch =
      summary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.tutor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.keyTopics.some((topic) => topic.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSubject = subjectFilter === "all" || summary.subject.toLowerCase() === subjectFilter.toLowerCase()

    const matchesDate = dateFilter === "all" || summary.date.toLowerCase().includes(dateFilter.toLowerCase())

    return matchesSearch && matchesSubject && matchesDate
  })

  const totalSessions = summaries.length
  const totalHours = summaries.reduce((acc, summary) => {
    const hours = Number.parseFloat(summary.duration.split("h")[0])
    const minutes = summary.duration.includes("m")
      ? Number.parseFloat(summary.duration.split("h")[1]?.split("m")[0] || "0")
      : 0
    return acc + hours + minutes / 60
  }, 0)
  const completedActions = summaries.reduce(
    (acc, summary) => acc + summary.actionItems.filter((item) => item.completed).length,
    0,
  )
  const totalActions = summaries.reduce((acc, summary) => acc + summary.actionItems.length, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.main className="mx-auto w-full max-w-7xl px-6 py-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Session Summaries</h1>
          </div>
          <p className="text-muted-foreground">Review your learning progress and action items</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="grid gap-6 md:grid-cols-4 mb-8" variants={containerVariants}>
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">{totalSessions}</span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Study Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">{totalHours.toFixed(1)}h</span>
                  <Clock className="h-4 w-4 text-primary" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    {completedActions}/{totalActions}
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">{Math.round((completedActions / totalActions) * 100)}%</span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div className="mb-8 space-y-4" variants={itemVariants}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search summaries, tutors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{filteredSummaries.length} summaries found</span>
            {(searchQuery || subjectFilter !== "all" || dateFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSubjectFilter("all")
                  setDateFilter("all")
                }}
                className="text-xs"
              >
                Clear filters
              </Button>
            )}
          </div>
        </motion.div>

        {/* Summaries List */}
        <motion.div className="space-y-6" variants={containerVariants}>
          {filteredSummaries.map((summary, index) => (
            <motion.div key={summary.id} variants={itemVariants} custom={index}>
              <SummaryCard summary={summary} />
            </motion.div>
          ))}
        </motion.div>

        {filteredSummaries.length === 0 && (
          <motion.div className="text-center py-12" variants={itemVariants}>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No summaries found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search criteria</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSubjectFilter("all")
                setDateFilter("all")
              }}
            >
              Clear all filters
            </Button>
          </motion.div>
        )}
      </motion.main>
    </div>
  )
}
