"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Phone,
  Settings,
  Users,
  PenTool,
  Send,
  Circle,
  Square,
  Minus,
  Type,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Participant {
  id: string
  name: string
  avatar: string
  isMuted: boolean
  isVideoOn: boolean
  isHost: boolean
}

const participants: Participant[] = [
  {
    id: "1",
    name: "Alex (You)",
    avatar: "/student-avatar.png",
    isMuted: false,
    isVideoOn: true,
    isHost: false,
  },
  {
    id: "2",
    name: "Dr. Sarah Chen",
    avatar: "/professional-woman-tutor.png",
    isMuted: false,
    isVideoOn: true,
    isHost: true,
  },
]

const chatMessages = [
  { id: "1", sender: "Dr. Sarah Chen", message: "Welcome to our calculus session!", timestamp: "2:58 PM" },
  { id: "2", sender: "Alex", message: "Thank you! Ready to learn derivatives", timestamp: "2:59 PM" },
  { id: "3", sender: "Dr. Sarah Chen", message: "Perfect! Let's start with the basics", timestamp: "3:00 PM" },
]

export function VideoRoom() {
  const router = useRouter()
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [selectedTool, setSelectedTool] = useState<"pen" | "circle" | "square" | "line" | "text">("pen")

  const handleEndCall = () => {
    router.push("/")
  }

  const whiteboardTools = [
    { id: "pen", icon: PenTool, label: "Pen" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "square", icon: Square, label: "Square" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "text", icon: Type, label: "Text" },
  ]

  return (
    <div className="h-[calc(100vh-4rem)] bg-background flex flex-col rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center space-x-4">
          <h1 className="font-display text-xl font-bold">Advanced Calculus Session</h1>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Live
          </Badge>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Circle className="w-2 h-2 fill-current mr-1" />
              Recording
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowWhiteboard(!showWhiteboard)}>
            <PenTool className="h-4 w-4 mr-2" />
            Whiteboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowChat(!showChat)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 p-4">
            <div className="grid gap-4 h-full" style={{ gridTemplateColumns: showChat ? "1fr" : "1fr 1fr" }}>
              {/* Main Video/Whiteboard Area */}
              <div className="relative bg-card rounded-2xl overflow-hidden shadow-sm">
                {showWhiteboard ? (
                  <div className="h-full bg-white relative">
                    {/* Whiteboard Toolbar */}
                    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
                      {whiteboardTools.map((tool) => {
                        const Icon = tool.icon
                        return (
                          <Button
                            key={tool.id}
                            variant={selectedTool === tool.id ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedTool(tool.id as any)}
                          >
                            <Icon className="h-4 w-4" />
                          </Button>
                        )
                      })}
                      <div className="w-px h-6 bg-border mx-2"></div>
                      <Button variant="ghost" size="sm">
                        Clear
                      </Button>
                    </div>
                    {/* Whiteboard Canvas */}
                    <div className="w-full h-full cursor-crosshair">
                      <svg className="w-full h-full">
                        {/* Sample drawing */}
                        <path
                          d="M 100 200 Q 200 100 300 200"
                          stroke="#d4a276"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                        />
                        <text x="150" y="250" fontSize="16" fill="#2b2a28">
                          f(x) = x²
                        </text>
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Users className="h-16 w-16 text-primary" />
                      </div>
                      <p className="text-lg font-medium">Screen Share Active</p>
                      <p className="text-sm text-muted-foreground">Dr. Chen is sharing her screen</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Participant Videos */}
              {!showChat && (
                <div className="space-y-4">
                  {participants.map((participant) => (
                    <motion.div
                      key={participant.id}
                      className="relative bg-card rounded-2xl overflow-hidden shadow-sm aspect-video"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                            <span className="text-lg font-medium text-primary">
                              {participant.name.split(" ")[0][0]}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{participant.name}</p>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 flex items-center space-x-1">
                        {participant.isHost && (
                          <Badge variant="secondary" className="text-xs">
                            Host
                          </Badge>
                        )}
                        {!participant.isMuted ? (
                          <div className="p-1 bg-green-500 rounded-full">
                            <Mic className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="p-1 bg-red-500 rounded-full">
                            <MicOff className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-border/40">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                onClick={() => setIsMuted(!isMuted)}
                className="rounded-full"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button
                variant={!isVideoOn ? "destructive" : "outline"}
                size="lg"
                onClick={() => setIsVideoOn(!isVideoOn)}
                className="rounded-full"
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button
                variant={isScreenSharing ? "default" : "outline"}
                size="lg"
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className="rounded-full"
              >
                {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              </Button>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="lg"
                onClick={() => setIsRecording(!isRecording)}
                className="rounded-full"
              >
                <Circle className={`h-5 w-5 ${isRecording ? "fill-current" : ""}`} />
              </Button>
              <Button variant="destructive" size="lg" className="rounded-full" onClick={handleEndCall}>
                <Phone className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-l border-border/40 bg-transparent"
            >
              <Card className="h-full rounded-2xl overflow-hidden border border-border/40 bg-card shadow-sm">
                <CardContent className="p-0 h-full flex flex-col">
                  <div className="p-4 border-b border-border/40">
                    <h3 className="font-medium">Session Chat</h3>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{msg.sender}</span>
                            <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-border/40">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
