"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Search, Star } from "lucide-react"
import { motion } from "framer-motion"

const tutors = [
  {
    id: "1",
    name: "Dr. Sarah Chen",
    avatar: "/professional-woman-tutor.png",
    subject: "Calculus",
    rating: 4.9,
    status: "online",
    lastMessage: "Great question about derivatives!",
    lastMessageTime: "2m ago",
  },
  {
    id: "2",
    name: "Prof. Michael Rodriguez",
    avatar: "/professional-man-physics-tutor.png",
    subject: "Physics",
    rating: 4.8,
    status: "online",
    lastMessage: "Let's work on that problem together",
    lastMessageTime: "5m ago",
  },
  {
    id: "3",
    name: "Dr. Emily Watson",
    avatar: "/professional-woman-chemistry-tutor.png",
    subject: "Chemistry",
    rating: 4.9,
    status: "away",
    lastMessage: "I'll send you some practice problems",
    lastMessageTime: "1h ago",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      staggerChildren: 0.1,
    } as const,
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.1, 0.25, 1.0],
    } as const,
  },
} as const;

export default function ChatPage() {
  const [selectedTutor, setSelectedTutor] = useState(tutors[0])
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTutors = tutors.filter(
    (tutor) =>
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.main className="mx-auto w-full max-w-7xl px-6 py-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center space-x-2 mb-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Chat with Tutors</h1>
          </div>
          <p className="text-muted-foreground">Connect directly with your tutors for instant help</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-4 h-[600px]">
          {/* Tutor List - Left Panel */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Your Tutors</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tutors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 overflow-y-auto">
                {filteredTutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    onClick={() => setSelectedTutor(tutor)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTutor.id === tutor.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={tutor.avatar || "/placeholder.svg"} alt={tutor.name} />
                          <AvatarFallback>
                            {tutor.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                            tutor.status === "online" ? "bg-green-500" : "bg-yellow-500"
                          }`}
                        ></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="font-medium text-sm truncate">{tutor.name}</p>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">{tutor.rating}</span>
                        </div>
                        <Badge variant="outline" className="text-xs mb-1">
                          {tutor.subject}
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate">{tutor.lastMessage}</p>
                        <p className="text-xs text-muted-foreground">{tutor.lastMessageTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat Interface - Right Panel */}
          <motion.div className="lg:col-span-3" variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedTutor.avatar || "/placeholder.svg"} alt={selectedTutor.name} />
                      <AvatarFallback>
                        {selectedTutor.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                        selectedTutor.status === "online" ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedTutor.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedTutor.subject}
                      </Badge>
                      <span className="text-sm text-muted-foreground capitalize">{selectedTutor.status}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages */}
              <CardContent className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {/* Sample messages */}
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-xs">
                      <p className="text-sm">Hi! I need help with calculus derivatives.</p>
                      <p className="text-xs opacity-70 mt-1">2:30 PM</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-xs">
                      <p className="text-sm">
                        Of course! I'd be happy to help. What specific concept are you struggling with?
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">2:32 PM</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-xs">
                      <p className="text-sm">I'm having trouble with the chain rule.</p>
                      <p className="text-xs opacity-70 mt-1">2:33 PM</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-xs">
                      <p className="text-sm">{selectedTutor.lastMessage}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedTutor.lastMessageTime}</p>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
