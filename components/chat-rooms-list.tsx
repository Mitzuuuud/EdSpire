"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Users, BookOpen, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { getUserChatRooms, type ChatRoom } from "@/lib/chat-room"
import { SessionChat } from "./session-chat"

interface ChatRoomsListProps {
  currentUser: {
    uid: string
    email: string
    name: string
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

export function ChatRoomsList({ currentUser }: ChatRoomsListProps) {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)

  useEffect(() => {
    loadChatRooms()
  }, [currentUser.uid])

  const loadChatRooms = async () => {
    try {
      setLoading(true)
      const rooms = await getUserChatRooms(currentUser.uid)
      setChatRooms(rooms)
    } catch (error) {
      console.error('Error loading chat rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatLastMessageTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getOtherParticipants = (room: ChatRoom) => {
    const otherParticipants = room.participants?.filter(
      participant => participant.userId !== currentUser.uid
    ) || []
    
    return otherParticipants
  }

  const getRoomDisplayInfo = (room: ChatRoom) => {
    const otherParticipants = getOtherParticipants(room)
    
    if (room.chatType === "general") {
      return {
        title: room.title,
        subtitle: `${room.participants?.length || 0} participants`,
        participants: otherParticipants,
        icon: "🌐"
      }
    } else if (room.chatType === "student") {
      return {
        title: room.title,
        subtitle: otherParticipants.map(p => p.name).join(", "),
        participants: otherParticipants,
        icon: "👥"
      }
    } else {
      // Session chat
      const otherParticipant = otherParticipants[0]
      return {
        title: room.subject || "Session Chat",
        subtitle: otherParticipant ? `${otherParticipant.name} (${otherParticipant.role})` : "Session Chat",
        participants: otherParticipants,
        icon: "📚"
      }
    }
  }

  if (selectedRoom) {
    return (
      <SessionChat
        room={selectedRoom}
        currentUser={currentUser}
        onClose={() => setSelectedRoom(null)}
      />
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : chatRooms.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Chats</h3>
            <p className="text-gray-500">
              You don't have any active session chats yet. Chat rooms are created automatically when booking requests are accepted.
            </p>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {chatRooms.map((room) => {
            const roomInfo = getRoomDisplayInfo(room)
            
            return (
              <motion.div key={room.id} variants={itemVariants}>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                  onClick={() => setSelectedRoom(room)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                        {roomInfo.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {roomInfo.title}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {room.chatType}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-500 mb-2">
                          {roomInfo.subtitle}
                        </div>
                        
                        {room.lastMessage && (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate flex-1">
                              {room.lastMessage}
                            </p>
                            <div className="flex items-center space-x-1 text-xs text-gray-400 ml-2">
                              <Clock className="h-3 w-3" />
                              <span>{formatLastMessageTime(room.lastMessageAt)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
