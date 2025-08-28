"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"
import { motion } from "framer-motion"

interface BookSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionBooked?: (sessionData: {
    tutor: string
    subject: string
    date: string
    time: string
  }) => void
}

export function BookSessionModal({ open, onOpenChange, onSessionBooked }: BookSessionModalProps) {
  const [selectedTutor, setSelectedTutor] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [subject, setSubject] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedTutor && selectedDate && selectedTime && subject) {
      const tutorNames: { [key: string]: string } = {
        "sarah-chen": "Dr. Chen",
        "mike-johnson": "Dr. Johnson",
        "emily-davis": "Prof. Davis",
        "david-wilson": "D. Wilson",
      }

      const sessionData = {
        tutor: tutorNames[selectedTutor] || selectedTutor,
        subject,
        date: selectedDate,
        time: selectedTime,
      }

      onSessionBooked?.(sessionData)

      setSelectedTutor("")
      setSelectedDate("")
      setSelectedTime("")
      setSubject("")
      setNotes("")
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.3 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Book a Session</span>
            </DialogTitle>
            <DialogDescription>Schedule a tutoring session with one of our expert tutors.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="tutor">Select Tutor</Label>
              <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tutor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarah-chen">Dr. Sarah Chen - Calculus</SelectItem>
                  <SelectItem value="mike-johnson">Dr. Mike Johnson - Physics</SelectItem>
                  <SelectItem value="emily-davis">Prof. Emily Davis - Chemistry</SelectItem>
                  <SelectItem value="david-wilson">David Wilson - Algebra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="15:00">3:00 PM</SelectItem>
                    <SelectItem value="16:00">4:00 PM</SelectItem>
                    <SelectItem value="17:00">5:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject/Topic</Label>
              <Input
                id="subject"
                placeholder="e.g., Derivatives, Quantum Physics, Organic Chemistry"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific topics or questions you'd like to focus on..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Book Session
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
