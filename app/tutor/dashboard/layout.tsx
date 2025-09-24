"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TutorNavbar } from "@/components/tutor-navbar"

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Check if user is a tutor
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "tutor") {
      router.push("/signin")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background">
      <TutorNavbar />
      {children}
    </div>
  )
}