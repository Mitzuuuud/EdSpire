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
import { Calendar, Coins, AlertCircle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { deductTokens, getUserTokenBalance } from "@/lib/token-deduction"
import { bookSession, createSessionTimes } from "@/lib/session-booking"

interface BookSessionModalProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  onSessionBookedAction?: (sessionData: {
    tutor: string
    subject: string
    date: string
    time: string
    cost: number
  }) => void
}

export function BookSessionModal({ open, onOpenChangeAction, onSessionBookedAction }: BookSessionModalProps) {
  const [selectedTutor, setSelectedTutor] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [subject, setSubject] = useState("")
  const [notes, setNotes] = useState("")
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)
  const [userBalance, setUserBalance] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Tutor pricing (tokens per hour)
  const tutorPricing: { [key: string]: number } = {
    "sarah-chen": 40,      // Dr. Sarah Chen - Calculus
    "mike-johnson": 45,    // Dr. Mike Johnson - Physics  
    "emily-davis": 42,     // Prof. Emily Davis - Chemistry
    "david-wilson": 35,    // David Wilson - Algebra
  }

  // Load current user from localStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          setCurrentUser(user)
          
          // Load user's current token balance
          const balance = await getUserTokenBalance(user.uid)
          setUserBalance(balance)
        } else {
          setCurrentUser(null)
          setUserBalance(0)
        }
      } catch (e) {
        console.error('Failed to load user:', e)
        setCurrentUser(null)
        setUserBalance(0)
      }
    }

    if (open) {
      loadUser()
      setError(null)
      setSuccess(null)
      setShowConfirmDialog(false)
    }
  }, [open])

  // Calculate session cost based on selected tutor
  const getSessionCost = (): number => {
    if (!selectedTutor) return 0
    return tutorPricing[selectedTutor] || 0
  }

  const sessionCost = getSessionCost()
  const canAfford = userBalance >= sessionCost

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!currentUser) {
      setError("Please sign in to book a session")
      return
    }

    if (!selectedTutor || !selectedDate || !selectedTime || !subject) {
      setError("Please fill in all required fields")
      return
    }

    if (!canAfford) {
      setError(`Insufficient balance. You need ${sessionCost} tokens, but only have ${userBalance} tokens.`)
      return
    }

    // Show confirmation dialog instead of immediately processing
    setShowConfirmDialog(true)
  }

  const handleConfirmBooking = async () => {
    if (!currentUser) {
      setError("Please sign in to book a session")
      return
    }

    setIsProcessing(true)
    setShowConfirmDialog(false)

    try {
      console.log(`Starting session booking for ${currentUser.email}`)
      console.log(`Current balance: ${userBalance}, Session cost: ${sessionCost}`)

      // Deduct tokens from user's balance
      const deductionResult = await deductTokens(
        currentUser.uid, 
        sessionCost, 
        `Session booking: ${subject} with ${selectedTutor}`
      )

      console.log('Token deduction result:', deductionResult)

      if (!deductionResult.success) {
        console.error('Token deduction failed:', deductionResult.error)
        setError(deductionResult.error || "Failed to process payment")
        setIsProcessing(false)
        return
      }

      // Update local balance
      setUserBalance(deductionResult.newBalance || 0)
      console.log(`Token deduction successful. New balance: ${deductionResult.newBalance}`)

      // Create session times (assuming 1-hour sessions)
      const { startTime, endTime } = createSessionTimes(selectedDate, selectedTime, 1)

      const tutorNames: { [key: string]: string } = {
        "sarah-chen": "Dr. Chen",
        "mike-johnson": "Dr. Johnson",
        "emily-davis": "Prof. Davis",
        "david-wilson": "D. Wilson",
      }

      const tutorIds: { [key: string]: string } = {
        "sarah-chen": "tutor_sarah_chen",
        "mike-johnson": "tutor_mike_johnson",
        "emily-davis": "tutor_emily_davis",
        "david-wilson": "tutor_david_wilson",
      }

      // Save session to database
      console.log('Saving session to database...')
      const sessionDataForDb = {
        userId: currentUser.uid,
        tutorId: tutorIds[selectedTutor] || selectedTutor,
        tutorName: tutorNames[selectedTutor] || selectedTutor,
        studentEmail: currentUser.email,
        subject,
        startTime,
        endTime,
        date: selectedDate,
        status: 'scheduled' as const,
        cost: sessionCost,
        notes: notes || undefined,
      }
      
      console.log('Session data to save:', sessionDataForDb)
      
      const sessionBookingResult = await bookSession(sessionDataForDb)

      if (!sessionBookingResult.success) {
        console.error('Failed to save session:', sessionBookingResult.error)
        console.error('Session booking result:', sessionBookingResult)
        // Note: We don't revert the token deduction here as it's already processed
        // You might want to add compensation logic here
        setError(`Payment processed but failed to save session: ${sessionBookingResult.error}. Please contact support with your transaction details.`)
        setIsProcessing(false)
        return
      }

      console.log(`Session saved successfully with ID: ${sessionBookingResult.sessionId}`)

      const sessionDataForCallback = {
        tutor: tutorNames[selectedTutor] || selectedTutor,
        subject,
        date: selectedDate,
        time: selectedTime,
        cost: sessionCost,
      }

      onSessionBookedAction?.(sessionDataForCallback)

      setSuccess(`Session booked successfully! ${sessionCost} tokens deducted. New balance: ${deductionResult.newBalance} tokens. Session ID: ${sessionBookingResult.sessionId}`)

      // Reset form
      setSelectedTutor("")
      setSelectedDate("")
      setSelectedTime("")
      setSubject("")
      setNotes("")

      // Close modal after a short delay to show success message
      setTimeout(() => {
        onOpenChangeAction(false)
      }, 2000)

    } catch (error: any) {
      setError(error?.message || "Failed to book session")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[90vh] overflow-y-auto">
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

          {/* User Balance Display */}
          {currentUser && (
            <div className="flex items-center justify-between rounded-lg border p-3 bg-blue-50 mt-4">
              <div className="text-sm">
                <div className="font-medium">Your Balance</div>
                <div className="text-muted-foreground">
                  {currentUser.email}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {userBalance} EDS
                </Badge>
              </div>
            </div>
          )}

          {!currentUser && (
            <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 text-center mt-4">
              <div className="text-sm font-medium text-yellow-800">
                Please sign in to book a session
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="tutor">Select Tutor</Label>
              <Select value={selectedTutor} onValueChange={setSelectedTutor} disabled={!currentUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tutor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarah-chen">Dr. Sarah Chen - Calculus (40 EDS/hr)</SelectItem>
                  <SelectItem value="mike-johnson">Dr. Mike Johnson - Physics (45 EDS/hr)</SelectItem>
                  <SelectItem value="emily-davis">Prof. Emily Davis - Chemistry (42 EDS/hr)</SelectItem>
                  <SelectItem value="david-wilson">David Wilson - Algebra (35 EDS/hr)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Session Cost Summary */}
            {selectedTutor && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Session Cost (1 hour):</span>
                  <span className="font-semibold text-lg flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    {sessionCost} EDS
                  </span>
                </div>
                {currentUser && (
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                    <span className="text-muted-foreground">After booking:</span>
                    <span className={`font-medium ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                      {userBalance - sessionCost} EDS remaining
                    </span>
                  </div>
                )}
                {currentUser && !canAfford && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    Insufficient balance. You need {sessionCost - userBalance} more tokens.
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  disabled={!currentUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!currentUser}>
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
                disabled={!currentUser}
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
                disabled={!currentUser}
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
              <Button type="button" variant="outline" onClick={() => onOpenChangeAction(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={!currentUser || !canAfford || isProcessing}
              >
                {isProcessing ? "Processing..." : `Book Session${sessionCost > 0 ? ` (${sessionCost} EDS)` : ""}`}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>

    {/* Booking Confirmation Dialog */}
    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Confirm Booking</span>
          </DialogTitle>
          <DialogDescription>
            Please confirm your session booking details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3 bg-muted/50">
            <div className="text-sm font-medium mb-2">Booking Summary:</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tutor:</span>
                <span className="font-medium">
                  {selectedTutor ? (
                    {
                      "sarah-chen": "Dr. Sarah Chen",
                      "mike-johnson": "Dr. Mike Johnson",
                      "emily-davis": "Prof. Emily Davis", 
                      "david-wilson": "David Wilson"
                    }[selectedTutor] || selectedTutor
                  ) : "Not selected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-medium">{subject || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-medium">{selectedDate} at {selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-semibold text-primary">{sessionCost} EDS</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-blue-50">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-medium">{userBalance} EDS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">After Booking:</span>
                <span className={`font-medium ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                  {userBalance - sessionCost} EDS
                </span>
              </div>
            </div>
          </div>

          {!canAfford && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              Insufficient balance. You need {sessionCost - userBalance} more tokens.
            </div>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setShowConfirmDialog(false)} 
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmBooking} 
            className="flex-1"
            disabled={!canAfford || isProcessing}
          >
            {isProcessing ? "Processing..." : `Confirm & Pay ${sessionCost} EDS`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
