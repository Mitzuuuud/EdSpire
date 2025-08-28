"use client"

import { Navbar } from "@/components/navbar"
import { VideoRoom } from "@/components/video-room"

export default function VideoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <VideoRoom />
    </div>
  )
}
