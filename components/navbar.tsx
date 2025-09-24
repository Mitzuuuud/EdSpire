"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { TokenBalanceModal } from "@/components/token-balance-modal"
import { Menu, Wallet, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, DocumentSnapshot } from "firebase/firestore"

// Student navigation items
const studentNavItems = [
  { name: "Dashboard", href: "/" },
  { name: "AI", href: "/ai" },
  { name: "Tutors", href: "/tutors" },
  { name: "Chat", href: "/chat" },
  { name: "Schedule", href: "/schedule" },
  { name: "Video", href: "/video" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Summaries", href: "/summaries" },
  { name: "Profile", href: "/profile" },
]

// Tutor navigation items
const tutorNavItems = [
  { name: "Dashboard", href: "/dashboard/tutor" },
  { name: "Bookings", href: "/bookings/tutor" },
  { name: "Chat", href: "/chat/tutor" },
  { name: "Schedule", href: "/schedule/tutor" },
  { name: "Video", href: "/video/tutor" },
  { name: "Leaderboard", href: "/leaderboard/tutor" },
  { name: "Profile", href: "/profile/tutor" },
]

interface NavItem {
  name: string;
  href: string;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)

  const pathname = usePathname()
  const [navItems, setNavItems] = useState<NavItem[]>([])

  // Load user from localStorage and set up listener for changes
  const loadUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user')
      const userRole = localStorage.getItem('userRole')
      
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        
        // Set navigation items based on role
        if (user.role === "tutor" || userRole === "tutor") {
          setNavItems(tutorNavItems)
        } else {
          setNavItems(studentNavItems)
        }
      } else if (userRole) {
        // Fallback for old format
        if (userRole === "tutor") {
          setNavItems(tutorNavItems)
        } else {
          setNavItems(studentNavItems)
        }
      } else {
        // No user signed in
        setCurrentUser(null)
        setNavItems(studentNavItems) // Default to student nav
      }
    } catch (e) {
      console.error('Failed to load user from localStorage:', e)
      setCurrentUser(null)
    }
  }

  useEffect(() => {
    // Initial load
    loadUserFromStorage()
    
    // Listen for storage changes (when user signs out/in from another tab or component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'userRole') {
        console.log('Storage changed, reloading user...')
        loadUserFromStorage()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events when localStorage is changed in the same tab
    const handleCustomStorageChange = () => {
      loadUserFromStorage()
    }
    
    window.addEventListener('localStorageChange', handleCustomStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageChange', handleCustomStorageChange)
    }
  }, [])

  // Subscribe to user's token balance from Firestore
  useEffect(() => {
    if (!currentUser) {
      console.log('No current user, setting token balance to 0')
      setTokenBalance(0)
      return
    }
    
    console.log(`Setting up token balance subscription for ${currentUser.email}`)
    
    const userRef = doc(db, "users", currentUser.uid)
    const unsub = onSnapshot(userRef, (snap: DocumentSnapshot) => {
      if (snap.exists()) {
        const data = snap.data() as { tokenBalance?: number }
        const balance = typeof data.tokenBalance === "number" ? data.tokenBalance : 0
        console.log(`Token balance updated for ${currentUser.email}: ${balance}`)
        setTokenBalance(balance)
      } else {
        console.log(`No document found for ${currentUser.email}, setting balance to 0`)
        setTokenBalance(0)
      }
    }, (error) => {
      console.error('Error listening to token balance:', error)
      setTokenBalance(0)
    })
    
    return () => {
      console.log(`Cleaning up token balance subscription for ${currentUser.email}`)
      unsub()
    }
  }, [currentUser])

  // Handle sign out
  const handleSignOut = () => {
    try {
      localStorage.removeItem('user')
      localStorage.removeItem('userRole')
      setCurrentUser(null)
      setTokenBalance(0)
      
      // Trigger custom storage change event for same-tab updates
      window.dispatchEvent(new Event('localStorageChange'))
      
      // Redirect to sign in page
      window.location.href = '/signin'
    } catch (e) {
      console.error('Error signing out:', e)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center px-6 w-full">
        <Link href="/" className="flex items-center space-x-2 mr-8">
          <img src="/edspire-logo.png" alt="EdSpire Logo" className="h-32 w-auto rounded-lg" />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-muted-foreground",
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* User Section (Desktop) */}
        <div className="ml-auto hidden md:flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{currentUser.email}</span>
            </div>
          )}
          
          {/* Token Balance Button */}
          <Button
            variant="ghost"
            onClick={() => setIsTokenModalOpen(true)}
            className="inline-flex items-center gap-3 rounded-full bg-muted px-4 py-2 border border-border/50 shadow-sm hover:bg-muted/80 hover:shadow-md transition-all duration-200 h-auto"
          >
            <img src="/eds-logo.png" className="h-7 w-7 rounded-full" alt="EDS" />
            <span className="text-sm font-semibold">{tokenBalance}</span>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </Button>
          
          {/* Sign Out Button */}
          {currentUser && (
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden ml-auto items-center gap-2">
          {/* Mobile Token Balance */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTokenModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 border border-border/50 shadow-sm"
          >
            <img src="/eds-logo.png" className="h-5 w-5 rounded-full" alt="EDS" />
            <span className="text-xs font-semibold">{tokenBalance}</span>
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                {/* User Info in Mobile Menu */}
                {currentUser && (
                  <div className="px-4 py-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{currentUser.email}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Role: {currentUser.role}
                    </div>
                  </div>
                )}
                
                {/* Navigation Items */}
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-lg font-medium transition-colors hover:text-primary px-4 py-2 rounded-lg",
                      pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Sign Out Button in Mobile Menu */}
                {currentUser && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsOpen(false)
                      handleSignOut()
                    }}
                    className="mx-4 mt-4 justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Token Balance Modal (this updates Firestore after top-ups) */}
        <TokenBalanceModal
          isOpen={isTokenModalOpen}
          onCloseAction={() => setIsTokenModalOpen(false)}
          currentBalance={tokenBalance}
        />
      </div>
    </nav>
  )
}
