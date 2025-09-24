'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only allow access to signin page initially
    if (pathname === '/') {
      router.replace('/signin')
      return
    }

    // Get user role from localStorage
    const userRole = localStorage.getItem('userRole')
    
    // If no role and not on signin page, redirect to signin
    if (!userRole && pathname !== '/signin') {
      router.replace('/signin')
      return
    }
  }, [router, pathname])

  return null
}