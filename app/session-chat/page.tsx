"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { ChatRoomsList } from "@/components/chat-rooms-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Users } from "lucide-react"
import { motion } from "framer-motion"

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

export default function SessionChatPage() {
  const [currentUser, setCurrentUser] = useState<{
    uid: string
    email: string
    name: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            name: user.name || user.email.split('@')[0]
          })
        }
      } catch (e) {
        console.error('Failed to load user:', e)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-10">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Please Sign In</h2>
              <p className="text-gray-500">
                You need to be signed in to access session chats.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <motion.main 
        className="container mx-auto px-6 py-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Session Chats</h1>
          </div>
          <p className="text-gray-600">
            Communicate with your mentors and mentees about your tutoring sessions.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <ChatRoomsList currentUser={currentUser} />
        </motion.div>
      </motion.main>
    </div>
  )
}
