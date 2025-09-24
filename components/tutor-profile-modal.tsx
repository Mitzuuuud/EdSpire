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
import { Star, Wallet, Clock, BookOpen, Award, MessageCircle, Calendar } from "lucide-react"
import { TokenBalanceModal } from "@/components/token-balance-modal"
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface AvailabilitySlot {
  id: string;
  start: Date;
  end: Date;
  note?: string;
  studentLimit?: number;
  studentIds?: string[];
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
  onOpenChange: (open: boolean) => void
}

export function TutorProfileModal({
  tutor,
  open,
  onOpenChange,
}: TutorProfileModalProps) {
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]) // Track selected slot IDs

  // Load tutor's availability when modal opens
  useEffect(() => {
    if (open && tutor.id) {
      loadTutorAvailability();
    }
  }, [open, tutor.id]);

  const loadTutorAvailability = async () => {
    setLoadingAvailability(true);
    try {
      const now = new Date();
      const availabilityRef = collection(db, "users", tutor.id, "availability");
      const availabilityQuery = query(
        availabilityRef,
        where("start", ">=", Timestamp.fromDate(now)),
        orderBy("start", "asc")
      );
      
      const snapshot = await getDocs(availabilityQuery);
      const slots: AvailabilitySlot[] = snapshot.docs.map(doc => ({
        id: doc.id,
        start: doc.data().start.toDate(),
        end: doc.data().end.toDate(),
        note: doc.data().note,
        studentLimit: doc.data().studentLimit || 1,
        studentIds: doc.data().studentIds || []
      }));
      
      setAvailabilitySlots(slots.slice(0, 10)); // Show next 10 slots
    } catch (error) {
      console.error("Error loading tutor availability:", error);
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
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
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
                    No upcoming availability
                  </div>
                )}
                {!loadingAvailability && availabilitySlots.length > 0 && (
                  <div className="max-h-64 overflow-y-auto scrollbar-hide">
                    {/* 3-column grid of selectable time slots */}
                    <div className="grid grid-cols-3 gap-2">
                      {availabilitySlots.map((slot) => {
                        const isSelected = selectedSlots.includes(slot.id);
                        const canSelect = selectedSlots.length < 3 || isSelected;
                        
                        return (
                          <div
                            key={slot.id}
                            onClick={() => canSelect && handleSlotSelection(slot.id)}
                            className={`
                              relative p-2 rounded-lg border-2 transition-all duration-200 cursor-pointer
                              hover:shadow-md text-center min-h-[80px] flex flex-col justify-center
                              ${isSelected 
                                ? 'border-primary bg-primary/10 shadow-md' 
                                : canSelect 
                                  ? 'border-border hover:border-primary/50 bg-background' 
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
                            
                            {/* Date */}
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              {formatDate(slot.start)}
                            </div>
                            
                            {/* Time range - single line */}
                            <div className="text-xs font-semibold mb-1 text-center">
                              {formatTime(slot.start)} - {formatTime(slot.end)}
                            </div>
                            
                            {/* Duration only */}
                            <div className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              {getSlotDuration(slot.start, slot.end)}
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
          <div className="flex space-x-3 pt-4 border-t flex-shrink-0">
            <Button
              className="flex-1"
              onClick={() => setShowTokenModal(true)}
              disabled={tutor.availability === "offline" || selectedSlots.length === 0}
            >
              <Wallet className="h-4 w-4 mr-2" />
              {selectedSlots.length > 0 
                ? `Book ${selectedSlots.length} Session${selectedSlots.length > 1 ? 's' : ''} (${getTotalCost()} EdS)`
                : `Book Session (${tutor.hourlyRate} EdS/hr)`
              }
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={tutor.availability === "offline"}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat with Tutor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TokenBalanceModal 
        isOpen={showTokenModal}
        onCloseAction={() => {
          setShowTokenModal(false);
          onOpenChange(false); // Close the tutor profile modal as well
        }}
        currentBalance={0} // You can add actual balance state if needed
      />
    </>
  )
}