"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Clock, BookOpen, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { TutorProfileModal } from "@/components/tutor-profile-modal"

interface TutorCardProps {
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
}

const availabilityConfig = {
  available: { color: "bg-green-500", text: "Available Now", variant: "secondary" as const },
  busy: { color: "bg-yellow-500", text: "Busy", variant: "outline" as const },
  offline: { color: "bg-gray-400", text: "Offline", variant: "outline" as const },
}

export function TutorCard({ tutor }: TutorCardProps) {
  const availabilityInfo = availabilityConfig[tutor.availability]
  const router = useRouter()
  const [showProfileModal, setShowProfileModal] = useState(false)

  const handleChatTutor = () => {
    router.push("/chat")
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2, ease: "easeOut" }}>
        <Card className="hover:shadow-lg transition-shadow duration-200 rounded-2xl border-0 shadow-sm h-[450px] flex flex-col">
          <CardHeader>
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={tutor.avatar || "/placeholder.svg"} alt={tutor.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {tutor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{tutor.name}</h3>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{tutor.rating}</span>
                <span className="text-sm text-muted-foreground">({tutor.reviewCount})</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${availabilityInfo.color}`}></div>
                <Badge variant={availabilityInfo.variant} className="text-xs">
                  {availabilityInfo.text}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Subjects</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {tutor.subjects.map((subject) => (
                <Badge key={subject} variant="outline" className="text-xs">
                  {subject}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Rate</span>
            </div>
            <p className="text-lg font-semibold text-primary">{tutor.hourlyRate} Eds/hr</p>
          </div>

          {tutor.nextAvailable && tutor.availability !== "available" && (
            <div className="text-xs text-muted-foreground">Next available: {tutor.nextAvailable}</div>
          )}

          <div className="flex-1"></div>
          <div className="space-y-2">
            <Button 
              className="w-full" 
              disabled={tutor.availability === "offline"}
              onClick={() => setShowProfileModal(true)}
            >
              View Profile
            </Button>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              disabled={tutor.availability === "offline"}
              onClick={handleChatTutor}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat Tutor
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>

    <TutorProfileModal
      tutor={tutor}
      open={showProfileModal}
      onOpenChange={setShowProfileModal}
    />
    </>
  )
}
