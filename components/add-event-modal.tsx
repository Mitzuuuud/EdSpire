"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, AlertCircle, CheckCircle, BookOpen, Video, Coffee, Users, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"

interface CustomEvent {
  id: string
  title: string
  type: string
  date: string
  startTime: string
  endTime: string
  description?: string
  location?: string
  priority: string
  dayIndex?: number
  timeIndex?: number
  actualDate?: Date
}

interface AddEventModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  onEventAddedAction?: (eventData: {
    title: string
    type: string
    date: string
    startTime: string
    endTime: string
    description?: string
    location?: string
    priority: string
  }) => void
  selectedDate?: string
  selectedTime?: string
  editingEvent?: CustomEvent | null
}

export function AddEventModal({ 
  open, 
  onOpenChangeAction, 
  onEventAddedAction,
  selectedDate,
  selectedTime,
  editingEvent 
}: AddEventModalProps) {
  const [title, setTitle] = useState("")
  const [eventType, setEventType] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [priority, setPriority] = useState("medium")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Event type configurations
  const eventTypes = [
    {
      id: "study",
      label: "Study Session",
      icon: BookOpen,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      suggestions: ["Math Practice", "Physics Review", "Chemistry Lab Prep", "Literature Reading"]
    },
    {
      id: "tutoring",
      label: "Tutoring Session",
      icon: Users,
      color: "bg-green-100 text-green-700 border-green-200",
      suggestions: ["Calculus Tutoring", "Physics Help", "Chemistry Session", "Programming Help"]
    },
    {
      id: "meeting",
      label: "Meeting/Call",
      icon: Video,
      color: "bg-purple-100 text-purple-700 border-purple-200",
      suggestions: ["Study Group", "Project Discussion", "Teacher Meeting", "Online Class"]
    },
    {
      id: "break",
      label: "Break/Personal",
      icon: Coffee,
      color: "bg-orange-100 text-orange-700 border-orange-200",
      suggestions: ["Lunch Break", "Exercise", "Personal Time", "Rest"]
    },
    {
      id: "assignment",
      label: "Assignment/Homework",
      icon: Lightbulb,
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      suggestions: ["Math Homework", "Essay Writing", "Lab Report", "Project Work"]
    }
  ]

  const priorityOptions = [
    { value: "low", label: "Low Priority", color: "bg-gray-100 text-gray-700" },
    { value: "medium", label: "Medium Priority", color: "bg-blue-100 text-blue-700" },
    { value: "high", label: "High Priority", color: "bg-red-100 text-red-700" }
  ]

  // Pre-fill form when modal opens
  useEffect(() => {
    if (open) {
      if (editingEvent) {
        // Pre-fill with editing event data
        setTitle(editingEvent.title)
        setEventType(editingEvent.type)
        setDate(editingEvent.date)
        setStartTime(editingEvent.startTime)
        setEndTime(editingEvent.endTime)
        setDescription(editingEvent.description || "")
        setLocation(editingEvent.location || "")
        setPriority(editingEvent.priority)
      } else {
        // Pre-fill with new event defaults
        setDate(selectedDate || new Date().toISOString().split("T")[0])
        setStartTime(selectedTime || "")
        setEndTime("")
        setTitle("")
        setEventType("")
        setDescription("")
        setLocation("")
        setPriority("medium")
      }
      setError(null)
      setSuccess(null)
    }
  }, [open, selectedDate, selectedTime, editingEvent])

  // Auto-calculate end time when start time changes
  useEffect(() => {
    if (startTime && !endTime) {
      const [hours, minutes] = startTime.split(':').map(Number)
      const endDate = new Date()
      endDate.setHours(hours + 1, minutes, 0, 0) // Default 1 hour duration
      const endTimeString = endDate.toTimeString().slice(0, 5)
      setEndTime(endTimeString)
    }
  }, [startTime, endTime])

  const getSelectedEventType = () => {
    return eventTypes.find(type => type.id === eventType)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim() || !eventType || !date || !startTime || !endTime) {
      setError("Please fill in all required fields")
      return
    }

    // Validate time range
    const start = new Date(`${date}T${startTime}`)
    const end = new Date(`${date}T${endTime}`)
    
    if (end <= start) {
      setError("End time must be after start time")
      return
    }

    setIsProcessing(true)

    try {
      const eventData = {
        title,
        type: eventType,
        date,
        startTime,
        endTime,
        description: description || undefined,
        location: location || undefined,
        priority
      }

      if (editingEvent) {
        // Update existing event
        const updatedEvent = {
          ...editingEvent,
          ...eventData,
          actualDate: new Date(date)
        }
        
        // Update in localStorage
        const existingEvents = JSON.parse(localStorage.getItem('customEvents') || '[]')
        const updatedEvents = existingEvents.map((e: any) => 
          e.id === editingEvent.id ? updatedEvent : e
        )
        localStorage.setItem('customEvents', JSON.stringify(updatedEvents))
        
        setSuccess(`Event "${title}" updated successfully!`)
      } else {
        // Add new event
        onEventAddedAction?.(eventData)
        setSuccess(`Event "${title}" added successfully!`)
      }

      // Reset form
      setTitle("")
      setEventType("")
      setDescription("")
      setLocation("")
      setPriority("medium")

      // Close modal after a short delay
      setTimeout(() => {
        onOpenChangeAction(false)
        // Trigger a page refresh to show updated events
        window.location.reload()
      }, 1500)

    } catch (error: any) {
      setError(error?.message || "Failed to save event")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuickFill = (suggestion: string) => {
    setTitle(suggestion)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>{editingEvent ? 'Edit Event' : 'Add Event'}</span>
            </DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update your event details' : 'Schedule a new event, study session, or personal activity'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Event Type Selection */}
            <div className="space-y-3">
              <Label>Event Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {eventTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setEventType(type.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                        eventType === type.id
                          ? `${type.color} border-current shadow-sm`
                          : "border-border hover:border-border/60"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Suggestions */}
            {eventType && getSelectedEventType() && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Quick suggestions:</Label>
                <div className="flex flex-wrap gap-2">
                  {getSelectedEventType()!.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickFill(suggestion)}
                      className="text-xs h-7"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Event Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="What would you like to do?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Duration Display */}
            {startTime && endTime && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                Duration: {(() => {
                  const start = new Date(`2000-01-01T${startTime}`)
                  const end = new Date(`2000-01-01T${endTime}`)
                  const diffMs = end.getTime() - start.getTime()
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                  return `${diffHours}h ${diffMinutes}m`
                })()}
              </div>
            )}

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      priority === option.value
                        ? `${option.color} border border-current`
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Library, Room 101, Online, Home"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Notes/Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Any additional details, goals, or notes for this event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChangeAction(false)} 
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isProcessing}
              >
                {isProcessing 
                  ? (editingEvent ? "Updating..." : "Adding...") 
                  : (editingEvent ? "Update Event" : "Add Event")
                }
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}