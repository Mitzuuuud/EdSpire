"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

// Firebase config
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, onSnapshot } from "firebase/firestore"

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

const _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const db = getFirestore(_app)

const tutorNavItems = [
    { name: "Dashboard", href: "/tutor/dashboard" },
    { name: "Chat", href: "/tutor/chat" },
    { name: "Schedule", href: "/tutor/schedule" },
    { name: "Video", href: "/tutor/video" },
    { name: "Leaderboard", href: "/tutor/leaderboard" },
    { name: "Profile", href: "/tutor/profile" },
]

export function TutorNavbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [tokenBalance, setTokenBalance] = useState<number>(0)
    const [account, setAccount] = useState<string | null>(null)
    const pathname = usePathname()

    // Listen to token balance updates
    useEffect(() => {
        const userAddress = localStorage.getItem('walletAddress')
        if (!userAddress) return

        setAccount(userAddress)
        const unsub = onSnapshot(doc(db, "users", userAddress.toLowerCase()), (doc) => {
            if (doc.exists()) {
                setTokenBalance(doc.data()?.tokenBalance ?? 0)
            }
        })

        return () => unsub()
    }, [])

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-card backdrop-blur-lg">
            <div className="flex h-16 items-center px-4 md:px-6">
                {/* Logo - Same as student navbar */}
                < Link href="/tutor/dashboard" className="mr-8">
                    <div className="flex items-center space-x-2">
                        <Image
                            src="/edspire-logo.png"
                            alt="EdSpire Logo"
                            width={32}
                            height={32}
                            className="h-8 w-8"
                            priority
                        />
                        <span className="font-display text-xl font-bold">EdSpire</span>
                    </div>
                </Link>

                {/* Desktop Nav Items - Without icons */}
                <div className="hidden md:flex md:flex-1">
                    <div className="flex gap-2">
                        {tutorNavItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    pathname === item.href
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-primary"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right Section - Token Balance */}
                <div className="flex items-center space-x-4">
                    {/* Token Balance */}
                    <div className="hidden md:flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{tokenBalance} EdS</span>
                    </div>

                    {/* Profile Avatar */}
                    <Link href="/tutor/profile">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src="/professional-woman-tutor.png" alt="Dr. Sarah Chen" />
                            <AvatarFallback>SC</AvatarFallback>
                        </Avatar>
                    </Link>

                    {/* Mobile Menu Button */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                className="md:hidden"
                                onClick={() => setIsOpen(true)}
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <div className="flex flex-col space-y-4 mt-8">
                                {/* Mobile Profile Info */}
                                <div className="flex items-center space-x-4 px-4 py-2">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src="/professional-woman-tutor.png" alt="Dr. Sarah Chen" />
                                        <AvatarFallback>SC</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">Dr. Sarah Chen</div>
                                        <div className="text-sm text-muted-foreground">
                                            {tokenBalance} EdS
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    {tutorNavItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "px-4 py-3 text-base font-medium transition-colors",
                                                pathname === item.href
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:bg-muted hover:text-primary"
                                            )}
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav >
    )
}