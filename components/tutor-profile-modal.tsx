"use client"

import { useState } from "react"
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
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Tutor Profile</DialogTitle>
            <DialogDescription>
              View tutor details and book a session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
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

            {/* Availability */}
            <Card className="rounded-xl border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        tutor.availability === "available"
                          ? "bg-green-500"
                          : tutor.availability === "busy"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <span className="capitalize">{tutor.availability}</span>
                  </div>
                  {tutor.nextAvailable && (
                    <span className="text-sm text-muted-foreground">
                      Next available: {tutor.nextAvailable}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                className="flex-1"
                onClick={() => setShowTokenModal(true)}
                disabled={tutor.availability === "offline"}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Book Session ({tutor.hourlyRate} EdS/hr)
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
          </div>
        </DialogContent>
      </Dialog>

      <TokenBalanceModal 
        isOpen={showTokenModal}
        onClose={() => {
          setShowTokenModal(false);
          onOpenChange(false); // Close the tutor profile modal as well
        }}
        currentBalance={0} // You can add actual balance state if needed
      />
    </>
  )
}