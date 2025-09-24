"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { TokenBalanceModal } from "@/components/token-balance-modal"
import { Menu, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

// Student navigation items
const studentNavItems = [
  { name: "Dashboard", href: "/" },
  { name: "AI", href: "/ai" },
  { name: "Tutors", href: "/tutors" },
  { name: "Chat", href: "/chat" },
  { name: "Schedule", href: "/schedule" },
  { name: "Video", href: "/video" },
  { name: "Leaderboard", href: "/leaderboard/student" },
  { name: "Summaries", href: "/summaries" },
  { name: "Profile", href: "/profile" },
]

// Tutor navigation items
const tutorNavItems = [
  { name: "Dashboard", href: "/dashboard/tutor" },
  { name: "Bookings", href: "/bookings/tutor" },
  { name: "Chat", href: "/chat" },
  { name: "Schedule", href: "/schedule" },
  { name: "Video", href: "/video" },
  { name: "Leaderboard", href: "/leaderboard/tutor" },
  { name: "Profile", href: "/profile" },
]

interface NavItem {
  name: string;
  href: string;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)

  // 🔴 was hardcoded 10; now live
  const [tokenBalance, setTokenBalance] = useState<number>(0)

  // connected wallet (if any)
  const [account, setAccount] = useState<string | null>(null)

  const pathname = usePathname()
  const [navItems, setNavItems] = useState<NavItem[]>([])

  useEffect(() => {
    // Get user role from localStorage
    const userRole = localStorage.getItem("userRole")
    
    // Set navigation items based on role
    if (userRole === "tutor") {
      setNavItems(tutorNavItems)
    } else {
      setNavItems(studentNavItems)
    }
  }, [])

  // 1) Detect MetaMask selected account & listen for changes
  useEffect(() => {
    const eth = (window as any).ethereum
    if (!eth) return

    // pick currently-selected if site already connected
    const selected = eth.selectedAddress as string | undefined
    if (selected) setAccount(selected)

    const handleAccountsChanged = (accs: string[]) => {
      setAccount(accs?.[0] ?? null)
    }
    eth.on?.("accountsChanged", handleAccountsChanged)
    return () => eth.removeListener?.("accountsChanged", handleAccountsChanged)
  }, [])

  // 2) Subscribe to Firestore: users/{address}
  useEffect(() => {
    if (!account) {
      setTokenBalance(0)
      return
    }
    const ref = doc(db, "users", account.toLowerCase())
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { tokenBalance?: number }
        setTokenBalance(typeof data.tokenBalance === "number" ? data.tokenBalance : 0)
      } else {
        setTokenBalance(0)
      }
    })
    return () => unsub()
  }, [account])

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

        {/* Token Balance Button (Desktop) */}
        <div className="ml-auto mr-12 hidden md:flex">
          <Button
            variant="ghost"
            onClick={() => setIsTokenModalOpen(true)}
            className="inline-flex items-center gap-3 rounded-full bg-muted px-4 py-2 border border-border/50 shadow-sm hover:bg-muted/80 hover:shadow-md transition-all duration-200 h-auto"
          >
            <img src="/eds-logo.png" className="h-7 w-7 rounded-full" alt="EDS" />
            <span className="text-sm font-semibold">{tokenBalance}</span>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </Button>
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
