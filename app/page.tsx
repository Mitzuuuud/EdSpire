'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Get user role from localStorage
    const userRole = localStorage.getItem('userRole')
    
    // If no role, redirect to signin
    if (!userRole) {
      router.replace('/signin')
      return
    }

    // Route based on user role
    if (userRole === 'tutor') {
      router.replace('/tutor/dashboard')
    } else {
      router.replace('/dashboard')
    }
  }, [router, pathname])

  return null
}