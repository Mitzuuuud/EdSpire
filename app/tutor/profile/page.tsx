"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { TutorProfileSetup } from "@/components/tutor-profile-setup"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, BookOpen, Star, Edit, Save, X } from "lucide-react"
import { motion } from "framer-motion"
import {
  getTutorProfile,
  updateTutorProfile,
  isTutorProfileComplete,
  getTutorAvailability,
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  type TutorProfile,
  type AvailabilitySlot
} from "@/lib/profile-service"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
}

export default function TutorProfilePage() {
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showAddSlotModal, setShowAddSlotModal] = useState(false)
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' })
  const [addingSlot, setAddingSlot] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])

  // Form states for editing
  const [editForm, setEditForm] = useState({
    hourlyRate: 0,
    subjects: [] as string[],
    expertise: [] as string[],
  })

  // Load user and profile data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user from localStorage
        const userStr = localStorage.getItem('user')
        if (!userStr) {
          setError('Please sign in to access your profile')
          setLoading(false)
          return
        }

        const user = JSON.parse(userStr)
        if (user.role !== 'tutor') {
          setError('Access denied. This page is for tutors only.')
          setLoading(false)
          return
        }

        setCurrentUser(user)

        // Check if profile is complete
        const profileStatus = await isTutorProfileComplete(user.uid)
        if (!profileStatus.complete) {
          setShowSetup(true)
          setLoading(false)
          return
        }

        // Load tutor profile
        const profileResult = await getTutorProfile(user.uid)
        if (profileResult.success && profileResult.tutorProfile) {
          setTutorProfile(profileResult.tutorProfile)
          setEditForm({
            hourlyRate: profileResult.tutorProfile.hourlyRate || 0,
            subjects: profileResult.tutorProfile.subjects || [],
            expertise: profileResult.tutorProfile.expertise || [],
          })

          // Load availability slots
          const slotsResult = await getTutorAvailability(user.uid)
          if (slotsResult.success) {
            setAvailabilitySlots(slotsResult.slots || [])
          }
        } else {
          setShowSetup(true)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleSaveProfile = async () => {
    if (!currentUser) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updateTutorProfile(currentUser.uid, {
        hourlyRate: editForm.hourlyRate,
        subjects: editForm.subjects,
        expertise: editForm.expertise,
      })

      if (result.success) {
        setSuccess('Profile updated successfully!')
        setEditMode(false)
        
        // Reload profile data
        const profileResult = await getTutorProfile(currentUser.uid)
        if (profileResult.success && profileResult.tutorProfile) {
          setTutorProfile(profileResult.tutorProfile)
        }
      } else {
        setError(result.error || 'Failed to update profile')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSlot = async () => {
    if (!currentUser || !newSlot.date || !newSlot.startTime || !newSlot.endTime) return

    setAddingSlot(true)
    setError(null)

    try {
      const startDate = new Date(newSlot.date + 'T' + newSlot.startTime + ':00')
      const endDate = new Date(newSlot.date + 'T' + newSlot.endTime + ':00')

      const result = await createAvailabilitySlot({
        tutorId: currentUser.uid,
        startTime: startDate,
        endTime: endDate,
        isBooked: false,
        timezone: tutorProfile?.availabilitySettings?.timezone || 'America/New_York',
      })

      if (result.success) {
        setSuccess('Availability slot added successfully!')
        setShowAddSlotModal(false)
        setNewSlot({ date: '', startTime: '', endTime: '' })
        
        // Reload slots
        const slotsResult = await getTutorAvailability(currentUser.uid)
        if (slotsResult.success) {
          setAvailabilitySlots(slotsResult.slots || [])
        }
      } else {
        setError(result.error || 'Failed to add slot')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add slot')
    } finally {
      setAddingSlot(false)
    }
  }

  const handleSaveAvailabilitySettings = async () => {
    if (!currentUser || !tutorProfile) return

    setSaving(true)
    setError(null)

    try {
      // Update availability settings if needed (min/max duration, timezone)
      const result = await updateTutorProfile(currentUser.uid, {
        availabilitySettings: tutorProfile.availabilitySettings,
      })

      if (result.success) {
        setSuccess('Availability settings saved!')
      } else {
        setError(result.error || 'Failed to save settings')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleProfileSetupComplete = () => {
    setShowSetup(false)
    // Reload the page to show the complete profile
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <TutorProfileSetup 
            userId={currentUser?.uid || ''}
            userEmail={currentUser?.email || ''}
            onComplete={handleProfileSetupComplete}
          />
        </div>
      </div>
    )
  }

  if (error && !tutorProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => window.location.href = '/signin'}>
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <motion.div 
        className="container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Success/Error Messages */}
        {success && (
          <motion.div 
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between"
            variants={itemVariants}
          >
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 text-green-600">✓</div>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSuccess(null)}
              className="p-1"
            >
              ×
            </Button>
          </motion.div>
        )}

        {error && (
          <motion.div 
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between"
            variants={itemVariants}
          >
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 text-red-600">⚠</div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="p-1"
            >
              ×
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src="/professional-woman-tutor.png" />
                  <AvatarFallback className="text-lg">
                    {currentUser?.email?.charAt(0).toUpperCase() || 'T'}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{currentUser?.email}</CardTitle>
                <div className="flex items-center justify-center space-x-1 mt-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">5.0</span>
                  <span className="text-muted-foreground">(0 reviews)</span>
                </div>
                <p className="text-lg font-semibold text-primary mt-2">
                  {tutorProfile?.hourlyRate || 25} EdS/hr
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Experience</h4>
                    <p className="text-sm text-muted-foreground">
                      {tutorProfile?.yearsOfExperience || 0} years
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-1">
                      {tutorProfile?.specialties?.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      )) || <p className="text-sm text-muted-foreground">No specialties set</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Details */}
          <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
            {/* Basic Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <Button
                  variant={editMode ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    if (editMode) {
                      setEditMode(false)
                      // Reset form
                      if (tutorProfile) {
                        setEditForm({
                          hourlyRate: tutorProfile.hourlyRate || 0,
                          subjects: tutorProfile.subjects || [],
                          expertise: tutorProfile.expertise || [],
                        })
                      }
                    } else {
                      setEditMode(true)
                    }
                  }}
                >
                  {editMode ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {editMode ? (
                  <>
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate (EdS)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={editForm.hourlyRate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                      />
                    </div>

                    <div className="flex space-x-4">
                      <Button onClick={handleSaveProfile} disabled={saving}>
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h4 className="font-medium mb-2">Subjects</h4>
                      <div className="flex flex-wrap gap-2">
                        {tutorProfile?.subjects?.map((subject) => (
                          <Badge key={subject} className="bg-primary/10 text-primary">
                            {subject}
                          </Badge>
                        )) || <p className="text-sm text-muted-foreground">No subjects set</p>}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {tutorProfile?.expertise?.map((exp) => (
                          <Badge key={exp} variant="secondary">
                            {exp}
                          </Badge>
                        )) || <p className="text-sm text-muted-foreground">No expertise set</p>}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Availability Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Min Session</h4>
                      <p className="text-sm text-muted-foreground">
                        {tutorProfile?.availabilitySettings?.minSessionDuration || 30} minutes
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Max Session</h4>
                      <p className="text-sm text-muted-foreground">
                        {tutorProfile?.availabilitySettings?.maxSessionDuration || 120} minutes
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Timezone</h4>
                    <p className="text-sm text-muted-foreground">
                      {tutorProfile?.availabilitySettings?.timezone || 'America/New_York'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Available Slots</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availabilitySlots.length > 0 ? (
                        availabilitySlots.map((slot: AvailabilitySlot, index: number) => (
                          <div key={slot.id || index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm">
                              {slot.startTime.toLocaleDateString()} from {slot.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} to {slot.endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (currentUser && slot.id) {
                                  const result = await deleteAvailabilitySlot(currentUser.uid, slot.id);
                                  if (result.success) {
                                    // Reload slots
                                    const slotsResult = await getTutorAvailability(currentUser.uid);
                                    if (slotsResult.success) {
                                      setAvailabilitySlots(slotsResult.slots || []);
                                    }
                                    setSuccess('Availability slot removed');
                                  } else {
                                    setError('Failed to remove slot');
                                  }
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No availability slots set</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddSlotModal(true)}
                    >
                      Add Availability Slot
                    </Button>
                    <Button
                      onClick={handleSaveAvailabilitySettings}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Availability Slot Modal */}
            <Dialog open={showAddSlotModal} onOpenChange={setShowAddSlotModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Availability Slot</DialogTitle>
                  <DialogDescription>
                    Set a date and time when you're available for sessions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="slotDate">Date</Label>
                    <Input
                      id="slotDate"
                      type="date"
                      value={newSlot.date}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddSlotModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSlot} disabled={addingSlot}>
                    {addingSlot ? 'Adding...' : 'Add Slot'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
