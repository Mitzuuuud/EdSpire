"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle, Users, BookOpen } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  getChatMessages, 
  addMessage, 
  subscribeToChatMessages, 
  type ChatMessage, 
  type ChatRoom 
} from "@/lib/chat-room"

interface SessionChatProps {
  room: ChatRoom
  currentUser: {
    uid: string
    email: string
    name: string
  }
  onClose?: () => void
}

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" }
  }
}

export function SessionChat({ room, currentUser, onClose }: SessionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const initialMessages = await getChatMessages(room.id!)
        setMessages(initialMessages)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading messages:', error)
        setIsLoading(false)
      }
    }

    if (room.id) {
      loadMessages()
    }
  }, [room.id])

  // Subscribe to real-time messages
  useEffect(() => {
    if (!room.id) return

    const unsubscribe = subscribeToChatMessages(room.id, (newMessages) => {
      setMessages(newMessages)
    })

    return () => unsubscribe()
  }, [room.id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !room.id) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setIsSending(true)

    try {
      const result = await addMessage(room.id, {
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        content: messageContent,
        messageType: "text"
      })

      if (!result.success) {
        console.error('Failed to send message:', result.error)
        // Restore the message if sending failed
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const isCurrentUser = (senderId: string) => senderId === currentUser.uid
  const isSystemMessage = (message: ChatMessage) => message.messageType === "system"

  return (
    <Card className="h-[600px] flex flex-col rounded-2xl border-0 shadow-lg overflow-hidden">
      <CardHeader className="pb-3 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {room.subject} Session Chat
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                <span>{room.studentName} & {room.tutorName}</span>
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <MessageCircle className="h-8 w-8 mb-2" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      className={`flex ${isCurrentUser(message.senderId) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[80%] ${isCurrentUser(message.senderId) ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isSystemMessage(message) && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src="" alt={message.senderName} />
                            <AvatarFallback className="text-xs">
                              {message.senderName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`flex flex-col min-w-0 ${isCurrentUser(message.senderId) ? 'items-end' : 'items-start'}`}>
                          {!isSystemMessage(message) && (
                            <div className="text-xs text-gray-500 mb-1">
                              {message.senderName} • {formatTime(message.timestamp)}
                            </div>
                          )}
                          
                          <div
                            className={`px-3 py-2 rounded-2xl break-words whitespace-pre-wrap ${
                              isSystemMessage(message)
                                ? 'bg-gray-100 text-gray-600 text-sm text-center'
                                : isCurrentUser(message.senderId)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Input */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
