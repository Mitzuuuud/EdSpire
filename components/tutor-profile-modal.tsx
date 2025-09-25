"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Star, Wallet, Clock, BookOpen, Award, MessageCircle, Calendar, AlertCircle, CheckCircle, Coins } from "lucide-react"
import { deductTokens, getUserTokenBalance } from "@/lib/token-deduction"
import { bookSession } from "@/lib/session-booking"
import { TokenBalanceModal } from "@/components/token-balance-modal"
import { AddEventModal } from "@/components/add-event-modal"
import { collection, query, where, orderBy, getDocs, Timestamp, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AvailabilitySlot {
  id: string;
  start: Date;
  end: Date;
  note?: string;
  studentLimit?: number;
  studentIds?: string[];
  isBooked?: boolean;
}

interface TutorProfileModalProps {
  tutor: {
    id: string
    name: string
    avatar: string
    subjects: string[]
    rating: number
    reviewCount: number
    hourlyRate: number
    availability: "available" | "busy" | "offline"
    nextAvailable?: string
    specialties: string[]
  }
  open: boolean
  onOpenChangeAction: (open: boolean) => void
}

export function TutorProfileModal({
  tutor,
  open,
  onOpenChangeAction,
}: TutorProfileModalProps) {
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]) // Track selected slot IDs
  const [selectedSlotForEvent, setSelectedSlotForEvent] = useState<AvailabilitySlot | null>(null)
  
  // Booking state
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)
  const [userBalance, setUserBalance] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Load tutor's availability when modal opens
  useEffect(() => {
    if (open && tutor.id) {
      loadTutorAvailability();
    }
  }, [open, tutor.id]);

  // Load current user and balance when modal opens
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
  }, [open]);

  const loadTutorAvailability = async () => {
    setLoadingAvailability(true);
    setError(null);
    
    try {
      console.log(`Loading availability for tutor: ${tutor.id}`);
      const now = new Date();
      const availabilityRef = collection(db, "users", tutor.id, "availability");
      
      // Create query to get future availability slots
      const availabilityQuery = query(
        availabilityRef,
        where("endTime", ">", Timestamp.fromDate(now)),
        orderBy("endTime", "asc")
      );
      
      const snapshot = await getDocs(availabilityQuery);
      console.log(`Found ${snapshot.docs.length} availability documents`);
      
      let slots: AvailabilitySlot[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        console.log(`Processing doc ${doc.id}:`, data);
        
        try {
          let startDate: Date;
          let endDate: Date;
          
          // Handle different timestamp formats
          if (data.startTime && data.endTime) {
            // Firebase Timestamp format
            if (typeof data.startTime === 'object' && data.startTime.toDate) {
              startDate = data.startTime.toDate();
              endDate = data.endTime.toDate();
            }
            // Timestamp with seconds/nanoseconds
            else if (data.startTime.seconds) {
              const startMs = data.startTime.seconds * 1000 + Math.floor((data.startTime.nanoseconds || 0) / 1e6);
              const endMs = data.endTime.seconds * 1000 + Math.floor((data.endTime.nanoseconds || 0) / 1e6);
              startDate = new Date(startMs);
              endDate = new Date(endMs);
            }
            // String format
            else if (typeof data.startTime === 'string') {
              startDate = new Date(data.startTime);
              endDate = new Date(data.endTime);
            }
            else {
              console.warn(`Unknown timestamp format for doc ${doc.id}:`, data.startTime);
              continue;
            }
          }
          // Fallback to old format (start/end)
          else if (data.start && data.end) {
            if (typeof data.start === 'object' && data.start.toDate) {
              startDate = data.start.toDate();
              endDate = data.end.toDate();
            } else if (data.start.seconds) {
              const startMs = data.start.seconds * 1000 + Math.floor((data.start.nanoseconds || 0) / 1e6);
              const endMs = data.end.seconds * 1000 + Math.floor((data.end.nanoseconds || 0) / 1e6);
              startDate = new Date(startMs);
              endDate = new Date(endMs);
            } else {
              startDate = new Date(data.start);
              endDate = new Date(data.end);
            }
          }
          else {
            console.warn(`No valid time fields found for doc ${doc.id}:`, data);
            continue;
          }
          
          // Validate dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn(`Invalid dates for doc ${doc.id}: start=${startDate}, end=${endDate}`);
            continue;
          }
          
          // Only include future slots
          if (startDate > now) {
            slots.push({
              id: doc.id,
              start: startDate,
              end: endDate,
              note: data.note,
              studentLimit: data.studentLimit || 1,
              studentIds: data.studentIds || [],
              isBooked: data.isBooked || false
            });
          }
        } catch (docError) {
          console.error(`Error processing doc ${doc.id}:`, docError);
        }
      }
      
      // Sort by start time and limit to next 10 slots
      slots.sort((a, b) => a.start.getTime() - b.start.getTime());
      const upcomingSlots = slots.slice(0, 10);
      
      console.log(`Processed ${upcomingSlots.length} valid upcoming slots`);
      setAvailabilitySlots(upcomingSlots);
      
      if (upcomingSlots.length === 0) {
        console.log('No upcoming availability found');
      }
      
    } catch (error) {
      console.error("Error loading tutor availability:", error);
      setError("Failed to load availability. Please try again.");
    } finally {
      setLoadingAvailability(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleSlotSelection = (slotId: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        // Deselect if already selected
        return prev.filter(id => id !== slotId);
      } else if (prev.length < 3) {
        // Select if under limit
        return [...prev, slotId];
      } else {
        // Replace oldest selection if at limit
        return [...prev.slice(1), slotId];
      }
    });
  };

  const getSlotDuration = (start: Date, end: Date) => {
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const getSlotCost = (start: Date, end: Date) => {
    const durationMs = end.getTime() - start.getTime();
    const hours = durationMs / (1000 * 60 * 60); // Convert to decimal hours
    return Math.round(hours * tutor.hourlyRate); // Round to nearest EdS
  };

  const getTotalCost = () => {
    return selectedSlots.reduce((total, slotId) => {
      const slot = availabilitySlots.find(s => s.id === slotId);
      if (slot) {
        return total + getSlotCost(slot.start, slot.end);
      }
      return total;
    }, 0);
  };

  const handleBookSession = async () => {
    if (!currentUser) {
      setError("Please sign in to book a session")
      return
    }

    if (selectedSlots.length === 0) {
      setError("Please select at least one time slot")
      return
    }

    const totalCost = getTotalCost()
    if (userBalance < totalCost) {
      setError(`Insufficient balance. You need ${totalCost} tokens, but only have ${userBalance} tokens.`)
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      console.log(`Starting session booking for ${currentUser.email}`)
      console.log(`Current balance: ${userBalance}, Total cost: ${totalCost}`)

      // Deduct tokens from user's balance
      const deductionResult = await deductTokens(
        currentUser.uid, 
        totalCost, 
        `Session booking: ${selectedSlots.length} session(s) with ${tutor.name}`
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

      // Save each selected session to database
      console.log('Saving sessions to database...')
      const sessionIds: string[] = []
      
      for (const slotId of selectedSlots) {
        const slot = availabilitySlots.find(s => s.id === slotId)
        if (slot) {
          const sessionBookingResult = await bookSession({
            userId: currentUser.uid,
            tutorId: tutor.id,
            tutorName: tutor.name,
            studentEmail: currentUser.email,
            subject: tutor.subjects[0] || 'General Tutoring', // Use first subject or default
            startTime: slot.start,
            endTime: slot.end,
            date: slot.start.toISOString().split('T')[0], // YYYY-MM-DD format
            status: 'scheduled',
            cost: getSlotCost(slot.start, slot.end),
            notes: `Booked through tutor profile for ${tutor.name}`,
          })

          if (sessionBookingResult.success && sessionBookingResult.sessionId) {
            sessionIds.push(sessionBookingResult.sessionId)
            console.log(`Session saved with ID: ${sessionBookingResult.sessionId}`)
          } else {
            console.error('Failed to save session:', sessionBookingResult.error)
            // Continue with other sessions even if one fails
          }
        }
      }

      const successMessage = sessionIds.length > 0 
        ? `${sessionIds.length} session(s) booked successfully! ${totalCost} tokens deducted. New balance: ${deductionResult.newBalance} tokens. Session IDs: ${sessionIds.slice(0, 2).join(', ')}${sessionIds.length > 2 ? '...' : ''}`
        : `Session(s) booked successfully! ${totalCost} tokens deducted. New balance: ${deductionResult.newBalance} tokens.`

      setSuccess(successMessage)

      // Reset selections
      setSelectedSlots([])
      setShowConfirmDialog(false)

      // Reload availability to reflect changes
      setTimeout(() => {
        loadTutorAvailability()
      }, 1000)

      // Close modal after showing success message
      setTimeout(() => {
        onOpenChangeAction(false)
      }, 2500)

    } catch (error: any) {
      console.error('Booking error:', error)
      setError(error?.message || "Failed to book session")
    } finally {
      setIsProcessing(false)
    }
  }

  const totalCost = getTotalCost()
  const canAfford = userBalance >= totalCost
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChangeAction}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">Tutor Profile</DialogTitle>
            <DialogDescription>
              View tutor details and book a session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2 scrollbar-hide">
            {/* Profile Header */}
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={tutor.avatar || "/placeholder.svg"} alt={tutor.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {tutor.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{tutor.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 font-medium">{tutor.rating}</span>
                  </div>
                  <span className="text-muted-foreground">({tutor.reviewCount} reviews)</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tutor.subjects.map((subject) => (
                    <Badge key={subject} variant="secondary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xl">{tutor.hourlyRate} EdS</div>
                <div className="text-sm text-muted-foreground">per hour</div>
              </div>
            </div>

            <Separator />

            {/* User Balance Display */}
            {currentUser && (
              <div className="flex items-center justify-between rounded-lg border p-3 bg-blue-50">
                <div className="text-sm">
                  <div className="font-medium">Your Balance</div>
                  <div className="text-muted-foreground">{currentUser.email}</div>
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
              <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
                <div className="text-sm font-medium text-yellow-800">
                  Please sign in to book a session
                </div>
              </div>
            )}

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

            {/* Cost Summary */}
            {currentUser && selectedSlots.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="font-semibold text-lg flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    {totalCost} EDS
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                  <span className="text-muted-foreground">After booking:</span>
                  <span className={`font-medium ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                    {userBalance - totalCost} EDS remaining
                  </span>
                </div>
                {!canAfford && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    Insufficient balance. You need {totalCost - userBalance} more tokens.
                  </div>
                )}
              </div>
            )}

            {/* Specialties */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Specialties
              </h4>
              <div className="flex flex-wrap gap-2">
                {tutor.specialties.map((specialty) => (
                  <Badge key={specialty} variant="outline">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Current Availability Status - Compact */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div
                  className={`h-2 w-2 rounded-full ${
                    tutor.availability === "available"
                      ? "bg-green-500"
                      : tutor.availability === "busy"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                />
                <span className="text-sm font-medium capitalize">{tutor.availability}</span>
              </div>
              {tutor.nextAvailable && (
                <span className="text-xs text-muted-foreground">
                  Next: {tutor.nextAvailable}
                </span>
              )}
            </div>

            {/* Upcoming Availability Schedule */}
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Select Sessions ({selectedSlots.length}/3)
                  </div>
                  {selectedSlots.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedSlots([])}
                      className="text-xs h-6 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAvailability && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Loading schedule...
                  </div>
                )}
                
                {!loadingAvailability && availabilitySlots.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    <div className="mb-2">No upcoming availability</div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadTutorAvailability}
                      className="text-xs"
                    >
                      Refresh
                    </Button>
                  </div>
                )}
                
                {!loadingAvailability && availabilitySlots.length > 0 && (
                  <div className="max-h-64 overflow-y-auto scrollbar-hide">
                    {/* 3-column grid of selectable time slots */}
                    <div className="grid grid-cols-3 gap-2">
                      {availabilitySlots.map((slot) => {
                        const isSelected = selectedSlots.includes(slot.id);
                        const canSelect = (selectedSlots.length < 3 || isSelected) && !slot.isBooked;
                        
                        return (
                          <div
                            key={slot.id}
                            onClick={() => canSelect && handleSlotSelection(slot.id)}
                            className={`
                              relative p-2 rounded-lg border-2 transition-all duration-200 
                              text-center min-h-[80px] flex flex-col justify-center
                              ${slot.isBooked 
                                ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60' 
                                : isSelected 
                                  ? 'border-primary bg-primary/10 shadow-md cursor-pointer hover:shadow-lg' 
                                  : canSelect 
                                    ? 'border-border hover:border-primary/50 bg-background cursor-pointer hover:shadow-md' 
                                    : 'border-border bg-muted/50 cursor-not-allowed opacity-60'
                              }
                            `}
                          >
                            {/* Selection indicator */}
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-primary-foreground">
                                  {selectedSlots.indexOf(slot.id) + 1}
                                </span>
                              </div>
                            )}
                            
                            {/* Booked indicator */}
                            {slot.isBooked && (
                              <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">X</span>
                              </div>
                            )}
                            
                            {/* Date */}
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {formatDate(slot.start)}
                            </div>
                            
                            {/* Time range - single line */}
                            <div className="text-xs font-semibold mb-1 text-center">
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </div>
                            
                            {/* Duration */}
                            <div className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              {getSlotDuration(slot.start, slot.end)}
                            </div>
                            
                            {/* Cost */}
                            <div className="text-xs text-primary font-medium mt-1">
                              {getSlotCost(slot.start, slot.end)} EdS
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Simple summary for selected sessions */}
                    {selectedSlots.length > 0 && (
                      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-primary">
                            {selectedSlots.length} session{selectedSlots.length > 1 ? 's' : ''} selected
                          </div>
                          <div className="text-sm font-bold text-primary">
                            Total: {getTotalCost()} EdS
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Action Buttons - Fixed at bottom */}
{/* Action Buttons - Fixed at bottom */}
<div className="flex space-x-3 pt-4 border-t flex-shrink-0">
  {/* Primary booking button (uses the existing bottom button) */}
  <Button
    className="flex-1"
    onClick={() => setShowConfirmDialog(true)}
    disabled={
      !currentUser ||
      selectedSlots.length === 0 ||
      !canAfford ||
      isProcessing
    }
  >
    {isProcessing
      ? "Processing..."
      : selectedSlots.length > 0
        ? `Book for ${totalCost} EDS`
        : "Select a session"}
  </Button>

  {/* Keep Chat button as secondary */}
  <Button
    variant="outline"
    className="flex-1"
    onClick={() => onOpenChangeAction(false)}
  >
    <MessageCircle className="h-4 w-4 mr-2" />
    Chat with Tutor
  </Button>
</div>

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
                  <span className="font-medium">{tutor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sessions:</span>
                  <span className="font-medium">{selectedSlots.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="font-semibold text-primary">{totalCost} EDS</span>
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
                    {userBalance - totalCost} EDS
                  </span>
                </div>
              </div>
            </div>

            {!canAfford && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                Insufficient balance. You need {totalCost - userBalance} more tokens.
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
              onClick={handleBookSession} 
              className="flex-1"
              disabled={!canAfford || isProcessing}
            >
              {isProcessing ? "Processing..." : `Confirm & Pay ${totalCost} EDS`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TokenBalanceModal 
        isOpen={showTokenModal}
        onCloseAction={() => {
          setShowTokenModal(false);
          onOpenChangeAction(false);
        }}
        currentBalance={0}
      />

      <AddEventModal
        open={showAddEventModal}
        onOpenChangeAction={setShowAddEventModal}
        onEventAddedAction={(eventData) => {
          setSuccess(`Event "${eventData.title}" scheduled with ${tutor.name}!`)
          setSelectedSlots([])
          setTimeout(() => {
            setShowAddEventModal(false)
            onOpenChangeAction(false)
          }, 1500)
        }}
        selectedDate={selectedSlotForEvent ? selectedSlotForEvent.start.toISOString().split('T')[0] : undefined}
        selectedTime={selectedSlotForEvent ? selectedSlotForEvent.start.toTimeString().slice(0, 5) : undefined}
      />
    </>
  )
}