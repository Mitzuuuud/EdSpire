"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { TutorCard } from "@/components/tutor-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Users } from "lucide-react"
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

const tutors = [
  {
    id: "1",
    name: "Lea",
    avatar: "/professional-woman-tutor.png",
    subjects: ["Calculus", "Linear Algebra", "Statistics"],
    rating: 4.9,
    reviewCount: 127,
    hourlyRate: 20,
    availability: "available" as const,
    specialties: ["Advanced Mathematics", "Test Prep"],
  },
  {
    id: "2",
    name: "Bryan",
    avatar: "/professional-man-physics-tutor.png",
    subjects: ["Physics", "Quantum Mechanics", "Thermodynamics"],
    rating: 4.8,
    reviewCount: 94,
    hourlyRate: 20,
    availability: "busy" as const,
    nextAvailable: "Tomorrow 2:00 PM",
    specialties: ["Advanced Physics", "Research Methods"],
  },
  {
    id: "3",
    name: "Kenneth",
    avatar: "/professional-woman-chemistry-tutor.png",
    subjects: ["Chemistry", "Organic Chemistry", "Biochemistry"],
    rating: 4.9,
    reviewCount: 156,
    hourlyRate: 30,
    availability: "available" as const,
    specialties: ["Lab Techniques", "Molecular Biology"],
  },
  {
    id: "4",
    name: "Kelvin",
    avatar: "/young-man-math-tutor.png",
    subjects: ["Algebra", "Geometry", "Pre-Calculus"],
    rating: 4.7,
    reviewCount: 73,
    hourlyRate: 5,
    availability: "available" as const,
    specialties: ["High School Math", "SAT Prep"],
  },
  {
    id: "5",
    name: "Angela",
    avatar: "/professional-woman-biology-tutor.png",
    subjects: ["Biology", "Genetics", "Microbiology"],
    rating: 4.8,
    reviewCount: 89,
    hourlyRate: 15,
    availability: "offline" as const,
    nextAvailable: "Monday 10:00 AM",
    specialties: ["Life Sciences", "Research"],
  },
  {
    id: "6",
    name: "Pintong",
    avatar: "/professional-man-computer-science-tutor.png",
    subjects: ["Computer Science", "Programming", "Data Structures"],
    rating: 4.9,
    reviewCount: 112,
    hourlyRate: 10,
    availability: "busy" as const,
    nextAvailable: "Today 6:00 PM",
    specialties: ["Software Engineering", "Algorithms"],
  },
]

export default function TutorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")

  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch =
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subjects.some((subject) => subject.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSubject =
      subjectFilter === "all" ||
      tutor.subjects.some((subject) => subject.toLowerCase().includes(subjectFilter.toLowerCase()))

    const matchesAvailability = availabilityFilter === "all" || tutor.availability === availabilityFilter

    return matchesSearch && matchesSubject && matchesAvailability
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.main className="mx-auto w-full max-w-7xl px-6 py-8 " variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Find Your Tutor</h1>
          </div>
          <p className="text-muted-foreground">Connect with expert tutors across various subjects</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div className="mb-8 space-y-4" variants={itemVariants}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tutors or subjects..."
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
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="computer">Computer Science</SelectItem>
                </SelectContent>
              </Select>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tutors</SelectItem>
                  <SelectItem value="available">Available Now</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">{filteredTutors.length} tutors found</span>
              {(searchQuery || subjectFilter !== "all" || availabilityFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setSubjectFilter("all")
                    setAvailabilityFilter("all")
                  }}
                  className="text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                {tutors.filter((t) => t.availability === "available").length} Available
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Tutors Grid */}
<motion.div 
  className="flex justify-center" 
  variants={containerVariants}
>
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {filteredTutors.map((tutor) => (
      <motion.div key={tutor.id} variants={itemVariants}>
        <TutorCard tutor={tutor} />
      </motion.div>
    ))}
  </div>
</motion.div>

        {filteredTutors.length === 0 && (
          <motion.div className="text-center py-12" variants={itemVariants}>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tutors found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search criteria</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSubjectFilter("all")
                setAvailabilityFilter("all")
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
