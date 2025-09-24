"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import JitsiRoomIframe from "@/components/JitsiRoomIframe"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Settings, 
  Copy, 
  CheckCircle,
  Video,
  Users,
  Shuffle
} from "lucide-react"

export default function VideoPage() {
  const [copied, setCopied] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isInSession, setIsInSession] = useState(false)
  const [currentRoomName, setCurrentRoomName] = useState("")

  // Generate a unique room code
  const generateRoomCode = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return random
  }

  // Check URL params on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlRoom = urlParams.get('room')
    if (urlRoom) {
      setCurrentRoomName(`edspire_${urlRoom}`)
      setRoomCode(urlRoom)
      setDisplayName("EdSpire User")
      setIsInSession(true)
    }
  }, [])

  const handleJoinRoom = () => {
    if (!displayName.trim()) return
    
    let finalRoomCode = roomCode.trim().toUpperCase()
    if (!finalRoomCode) {
      finalRoomCode = generateRoomCode()
      setRoomCode(finalRoomCode)
    }
    
    const fullRoomName = `edspire_${finalRoomCode}`
    setCurrentRoomName(fullRoomName)
    setIsInSession(true)
    
    // Update URL without page reload
    window.history.pushState({}, '', `/video?room=${finalRoomCode}`)
  }

  const handleCopyRoomCode = () => {
    const shareUrl = `${window.location.origin}/video?room=${roomCode}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateNewCode = () => {
    const newCode = generateRoomCode()
    setRoomCode(newCode)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {!isInSession ? (
        // Join Room Form
        <main className="mx-auto max-w-2xl px-6 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Video className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Join Video Session</h1>
            <p className="text-muted-foreground">
              Enter a room code to join an existing session or create a new one
            </p>
          </div>

          <Card className="border border-border/40">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Display Name</label>
                <Input
                  placeholder="Enter your name (e.g., Alex Student or Dr. Smith)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Room Code (Optional)</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter room code or leave empty"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="flex-1 font-mono"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateNewCode}
                    title="Generate random code"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code with others to join the same session
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">💡 How it works:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Leave room code empty to create a new session</li>
                    <li>• Enter a room code to join an existing session</li>
                    <li>• Share the room code with tutors/students</li>
                    <li>• HD video, screen sharing, and chat included</li>
                  </ul>
                </div>
              </div>

              <Button 
                onClick={handleJoinRoom}
                disabled={!displayName.trim()}
                className="w-full"
                size="lg"
              >
                <Users className="h-5 w-5 mr-2" />
                {roomCode ? `Join Room ${roomCode}` : 'Create New Room'}
              </Button>
            </CardContent>
          </Card>
        </main>
      ) : (
        // Video Session
        <main className="mx-auto max-w-7xl px-6 py-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">EdSpire Tutoring Session</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Live
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyRoomCode}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Share Room
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Room Code: <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{roomCode}</code>
            </div>
            <div className="text-sm text-muted-foreground">
              Share this code: <strong className="text-primary">{roomCode}</strong>
            </div>
          </div>

          <JitsiRoomIframe 
            roomName={currentRoomName}
            displayName={displayName}
          />
          
        </main>
      )}
    </div>
  )
}
