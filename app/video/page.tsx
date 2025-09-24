"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import JitsiRoomIframe from "@/components/JitsiRoomIframe"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Copy, 
  CheckCircle
} from "lucide-react"

export default function VideoPage() {
  const [copied, setCopied] = useState(false)

  // Generate a unique room name
  const generateRoomName = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `edspire_session_${timestamp}_${random}`
  }

  // Auto-generate room and user info
  const currentRoomName = generateRoomName()
  const displayName = "EdSpire User"

  const handleCopyRoomName = () => {
    navigator.clipboard.writeText(currentRoomName)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Video Session - Direct Entry */}
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
              onClick={handleCopyRoomName}
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

        <div className="mb-4 text-sm text-muted-foreground">
          Room: <code className="bg-muted px-2 py-1 rounded text-xs">{currentRoomName}</code>
        </div>

        <JitsiRoomIframe 
          roomName={currentRoomName}
          displayName={displayName}
        />
        
      </main>
    </div>
  )
}
