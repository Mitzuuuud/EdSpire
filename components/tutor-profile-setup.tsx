"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  User, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  X, 
  Calendar as CalendarIcon,
  GraduationCap,
  Award,
  DollarSign,
  Globe
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createTutorProfile, updateTutorProfile, type TutorProfile } from "@/lib/profile-service"

interface TutorProfileSetupProps {
  userId: string
  userEmail: string
  onComplete: () => void
  onSkip?: () => void
}

// Predefined options for subjects and specialties
const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "English", "History", "Geography", "Economics", "Psychology",
  "Art", "Music", "Foreign Languages", "Philosophy", "Statistics"
]

const SPECIALTIES = [
  "Test Preparation", "Homework Help", "Exam Preparation", "Advanced Topics",
  "Beginner Friendly", "Adult Learning", "Special Needs", "Online Tutoring",
  "Group Sessions", "One-on-One", "Project Assistance", "Research Help"
]

const EXPERTISE_BY_SUBJECT: Record<string, string[]> = {
  "Mathematics": ["Algebra", "Calculus", "Geometry", "Statistics", "Trigonometry", "Linear Algebra", "Differential Equations"],
  "Physics": ["Mechanics", "Thermodynamics", "Electromagnetism", "Quantum Physics", "Optics", "Nuclear Physics"],
  "Chemistry": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Biochemistry", "Analytical Chemistry"],
  "Biology": ["Cell Biology", "Genetics", "Ecology", "Anatomy", "Physiology", "Molecular Biology", "Evolution"],
  "Computer Science": ["Programming", "Data Structures", "Algorithms", "Web Development", "Machine Learning", "Database Design"],
  "English": ["Grammar", "Literature", "Creative Writing", "Essay Writing", "Reading Comprehension", "Poetry"],
  "History": ["World History", "American History", "European History", "Ancient History", "Modern History"],
  "Economics": ["Microeconomics", "Macroeconomics", "International Economics", "Econometrics", "Development Economics"]
}

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" }
]

export function TutorProfileSetup({ userId, userEmail, onComplete, onSkip }: TutorProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form data
  const [basicInfo, setBasicInfo] = useState({
    title: "",
    yearsOfExperience: 0,
    hourlyRate: 25,
    bio: ""
  })

  const [expertise, setExpertise] = useState({
    subjects: [] as string[],
    specialties: [] as string[],
    expertise: [] as string[],
    education: [] as { degree: string; institution: string; year?: number }[],
    certifications: [] as string[]
  })

  const [availability, setAvailability] = useState({
    timezone: "America/New_York",
    minSessionDuration: 30,
    maxSessionDuration: 120,
    advanceBookingDays: 14,
    bufferTime: 15
  })

  // UI state
  const [newSubject, setNewSubject] = useState("")
  const [newSpecialty, setNewSpecialty] = useState("")
  const [newExpertise, setNewExpertise] = useState("")
  const [newCertification, setNewCertification] = useState("")
  const [newEducation, setNewEducation] = useState({ degree: "", institution: "", year: undefined as number | undefined })

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  // Get available expertise based on selected subjects
  const getAvailableExpertise = () => {
    const available: string[] = []
    expertise.subjects.forEach(subject => {
      if (EXPERTISE_BY_SUBJECT[subject]) {
        available.push(...EXPERTISE_BY_SUBJECT[subject])
      }
    })
    return [...new Set(available)] // Remove duplicates
  }

  const handleAddItem = (type: 'subjects' | 'specialties' | 'expertise' | 'certifications', value: string) => {
    if (!value.trim()) return
    
    setExpertise(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }))

    // Clear the input
    switch (type) {
      case 'subjects': setNewSubject(""); break
      case 'specialties': setNewSpecialty(""); break
      case 'expertise': setNewExpertise(""); break
      case 'certifications': setNewCertification(""); break
    }
  }

  const handleRemoveItem = (type: 'subjects' | 'specialties' | 'expertise' | 'certifications', index: number) => {
    setExpertise(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const handleAddEducation = () => {
    if (!newEducation.degree.trim() || !newEducation.institution.trim()) return
    
    setExpertise(prev => ({
      ...prev,
      education: [...prev.education, { ...newEducation }]
    }))
    
    setNewEducation({ degree: "", institution: "", year: undefined })
  }

  const handleRemoveEducation = (index: number) => {
    setExpertise(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return basicInfo.yearsOfExperience >= 0 && basicInfo.hourlyRate > 0
      case 2:
        return expertise.subjects.length > 0 && expertise.specialties.length > 0
      case 3:
        return availability.minSessionDuration > 0 && availability.maxSessionDuration > availability.minSessionDuration
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
      setError(null)
    } else {
      setError("Please fill in all required fields before continuing.")
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSave = async () => {
    if (!validateStep(currentStep)) {
      setError("Please fill in all required fields.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const tutorProfileData: Partial<TutorProfile> = {
        title: basicInfo.title,
        yearsOfExperience: basicInfo.yearsOfExperience,
        hourlyRate: basicInfo.hourlyRate,
        subjects: expertise.subjects,
        specialties: expertise.specialties,
        expertise: expertise.expertise,
        education: expertise.education,
        certifications: expertise.certifications,
        availabilitySettings: availability,
        profileCompleted: true,
        setupStep: 4
      }

      const result = await createTutorProfile(userId, tutorProfileData)

      if (!result.success) {
        setError(result.error || "Failed to save profile")
        return
      }

      setSuccess("Profile setup completed successfully!")
      setTimeout(() => {
        onComplete()
      }, 1500)

    } catch (error: any) {
      console.error('Error saving tutor profile:', error)
      setError(error.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <User className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-muted-foreground">Tell us about your background and experience</p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title (Optional)</Label>
          <Select value={basicInfo.title} onValueChange={(value) => setBasicInfo(prev => ({ ...prev, title: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select your title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No title</SelectItem>
              <SelectItem value="Mr.">Mr.</SelectItem>
              <SelectItem value="Ms.">Ms.</SelectItem>
              <SelectItem value="Mrs.">Mrs.</SelectItem>
              <SelectItem value="Dr.">Dr.</SelectItem>
              <SelectItem value="Prof.">Prof.</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Years of Experience *</Label>
          <Input
            id="experience"
            type="number"
            min="0"
            value={basicInfo.yearsOfExperience}
            onChange={(e) => setBasicInfo(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 0 }))}
            placeholder="e.g., 5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Hourly Rate (EdS) *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="hourlyRate"
              type="number"
              min="1"
              value={basicInfo.hourlyRate}
              onChange={(e) => setBasicInfo(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 25 }))}
              className="pl-10"
              placeholder="25"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio (Optional)</Label>
          <Textarea
            id="bio"
            value={basicInfo.bio}
            onChange={(e) => setBasicInfo(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell students about yourself, your teaching style, and what makes you a great tutor..."
            rows={4}
          />
        </div>
      </div>
    </motion.div>
  )

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Expertise & Specialties</h2>
        <p className="text-muted-foreground">What subjects do you teach and what are your specialties?</p>
      </div>

      <div className="space-y-6">
        {/* Subjects */}
        <div className="space-y-3">
          <Label>Subjects You Teach *</Label>
          <div className="flex gap-2">
            <Select value={newSubject} onValueChange={setNewSubject}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.filter(s => !expertise.subjects.includes(s)).map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              onClick={() => handleAddItem('subjects', newSubject)}
              disabled={!newSubject || expertise.subjects.includes(newSubject)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {expertise.subjects.map((subject, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {subject}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleRemoveItem('subjects', index)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div className="space-y-3">
          <Label>Teaching Specialties *</Label>
          <div className="flex gap-2">
            <Select value={newSpecialty} onValueChange={setNewSpecialty}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a specialty" />
              </SelectTrigger>
              <SelectContent>
                {SPECIALTIES.filter(s => !expertise.specialties.includes(s)).map(specialty => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              onClick={() => handleAddItem('specialties', newSpecialty)}
              disabled={!newSpecialty || expertise.specialties.includes(newSpecialty)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {expertise.specialties.map((specialty, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {specialty}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleRemoveItem('specialties', index)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Specific Expertise */}
        {expertise.subjects.length > 0 && (
          <div className="space-y-3">
            <Label>Specific Areas of Expertise (Optional)</Label>
            <div className="flex gap-2">
              <Select value={newExpertise} onValueChange={setNewExpertise}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an area of expertise" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableExpertise().filter(e => !expertise.expertise.includes(e)).map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                onClick={() => handleAddItem('expertise', newExpertise)}
                disabled={!newExpertise || expertise.expertise.includes(newExpertise)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {expertise.expertise.map((area, index) => (
                <Badge key={index} variant="default" className="flex items-center gap-1">
                  {area}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveItem('expertise', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        <div className="space-y-3">
          <Label>Education (Optional)</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Degree (e.g., B.S. Mathematics)"
              value={newEducation.degree}
              onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
            />
            <Input
              placeholder="Institution"
              value={newEducation.institution}
              onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Year"
                value={newEducation.year || ""}
                onChange={(e) => setNewEducation(prev => ({ ...prev, year: parseInt(e.target.value) || undefined }))}
              />
              <Button 
                type="button" 
                onClick={handleAddEducation}
                disabled={!newEducation.degree.trim() || !newEducation.institution.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {expertise.education.map((edu, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div>
                  <span className="font-medium">{edu.degree}</span>
                  <span className="text-muted-foreground"> - {edu.institution}</span>
                  {edu.year && <span className="text-muted-foreground"> ({edu.year})</span>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEducation(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="space-y-3">
          <Label>Certifications (Optional)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter certification"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem('certifications', newCertification)}
            />
            <Button 
              type="button" 
              onClick={() => handleAddItem('certifications', newCertification)}
              disabled={!newCertification.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {expertise.certifications.map((cert, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                {cert}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleRemoveItem('certifications', index)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Availability Settings</h2>
        <p className="text-muted-foreground">Configure your scheduling preferences</p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone *</Label>
          <Select value={availability.timezone} onValueChange={(value) => setAvailability(prev => ({ ...prev, timezone: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minDuration">Min Session (minutes) *</Label>
            <Input
              id="minDuration"
              type="number"
              min="15"
              max="240"
              step="15"
              value={availability.minSessionDuration}
              onChange={(e) => setAvailability(prev => ({ ...prev, minSessionDuration: parseInt(e.target.value) || 30 }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxDuration">Max Session (minutes) *</Label>
            <Input
              id="maxDuration"
              type="number"
              min="30"
              max="480"
              step="15"
              value={availability.maxSessionDuration}
              onChange={(e) => setAvailability(prev => ({ ...prev, maxSessionDuration: parseInt(e.target.value) || 120 }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="advanceBooking">Advance Booking (days)</Label>
            <Input
              id="advanceBooking"
              type="number"
              min="1"
              max="90"
              value={availability.advanceBookingDays}
              onChange={(e) => setAvailability(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) || 14 }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
            <Input
              id="bufferTime"
              type="number"
              min="0"
              max="60"
              step="5"
              value={availability.bufferTime}
              onChange={(e) => setAvailability(prev => ({ ...prev, bufferTime: parseInt(e.target.value) || 15 }))}
            />
          </div>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Settings Summary:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Students can book sessions {availability.minSessionDuration}-{availability.maxSessionDuration} minutes long</li>
            <li>• Bookings allowed up to {availability.advanceBookingDays} days in advance</li>
            <li>• {availability.bufferTime} minute buffer between sessions</li>
            <li>• All times shown in {TIMEZONES.find(tz => tz.value === availability.timezone)?.label}</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Tutor Profile Setup</CardTitle>
              <p className="text-muted-foreground">Step {currentStep} of {totalSteps}</p>
            </div>
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
            )}
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </AnimatePresence>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={!validateStep(currentStep)}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={loading || !validateStep(currentStep)}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
