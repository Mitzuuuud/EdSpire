'use client';

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Wallet, CreditCard, Coins, PlugZap } from "lucide-react"
import { BrowserProvider, Contract, JsonRpcSigner, ethers } from "ethers"

// ==== FIREBASE ====
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore"

// Your Firebase config (⚠️ replace with your actual values)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

// Reuse app instance
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const db = getFirestore(app)

declare global { interface Window { ethereum?: any } }

interface TokenBalanceModalProps {
  isOpen: boolean
  onCloseAction: () => void
  currentBalance: number // legacy, unused
}

/** ======= CONFIG ======= */
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7" // 11155111
const GATEWAY_ADDRESS = "0xaaFf27Be8e0d72c601eaee90fDb5D4B23a5c8387" // your deployed contract
const GATEWAY_ABI = [
  "function WEI_PER_TOKEN() view returns (uint256)",
  "function tokenBalanceOf(address) view returns (uint256)",
  "function deposit() payable",
  "function depositFor(address) payable",
  "function treasury() view returns (address)",
]
const getWeiPerToken = () => ethers.parseEther("0.0001")

function truncate(addr?: string) {
  if (!addr) return ""
  return addr.slice(0, 6) + "…" + addr.slice(-4)
}

export function TokenBalanceModal({ isOpen, onCloseAction }: TokenBalanceModalProps) {
  const [topUpAmount, setTopUpAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [tokenBalanceStr, setTokenBalanceStr] = useState("0")
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)

  const predefinedAmounts = [10, 25, 50, 100, 250, 500]

  const contract = useMemo(() => {
    if (!signer) return null
    return new Contract(GATEWAY_ADDRESS, GATEWAY_ABI, signer)
  }, [signer])

  // Load current user from localStorage on component mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        
        // Initialize user document in Firestore if it doesn't exist
        initializeUserDocument(user)
      } else {
        setCurrentUser(null)
        setTokenBalanceStr("0")
      }
    } catch (e) {
      console.error('Failed to load user from localStorage:', e)
      setCurrentUser(null)
      setTokenBalanceStr("0")
    }
  }, [])

  // Initialize user document in Firestore
  async function initializeUserDocument(user: {uid: string, email: string, role: string}) {
    try {
      const userRef = doc(db, "users", user.uid)
      
      // First check if the user document already exists
      const existingDoc = await getDoc(userRef)
      
      if (existingDoc.exists()) {
        // Document exists, only update missing fields without overwriting tokenBalance
        const existingData = existingDoc.data()
        const updateData: any = {
          uid: user.uid,
          email: user.email,
          role: user.role,
          updatedAt: serverTimestamp(),
        }
        
        // Only add tokenBalance if it doesn't exist or is undefined
        if (existingData.tokenBalance === undefined || existingData.tokenBalance === null) {
          updateData.tokenBalance = 0
          console.log(`Setting initial tokenBalance to 0 for ${user.email}`)
        } else {
          console.log(`Preserving existing tokenBalance (${existingData.tokenBalance}) for ${user.email}`)
        }
        
        // Only add createdAt if it doesn't exist
        if (!existingData.createdAt) {
          updateData.createdAt = serverTimestamp()
        }
        
        await setDoc(userRef, updateData, { merge: true })
      } else {
        // Document doesn't exist, create it with initial values
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          role: user.role,
          tokenBalance: 0, // Initialize new users with 0 tokens
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        console.log(`Created new user document for ${user.email} with tokenBalance: 0`)
      }
      
      console.log(`Initialized user document for ${user.email} (${user.uid})`)
    } catch (e) {
      console.error('Failed to initialize user document:', e)
    }
  }

  async function ensureSepolia(provider: BrowserProvider) {
    const net = await provider.getNetwork()
    if (Number(net.chainId) !== 11155111) {
      try {
        // First try to switch to Sepolia
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
        })
      } catch (switchError: any) {
        // If switching fails (chain not added), add the chain first
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: "Sepolia Test Network",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.infura.io/v3/"],
                blockExplorerUrls: ["https://sepolia.etherscan.io/"],
              }],
            })
          } catch (addError) {
            console.error("Failed to add Sepolia network:", addError)
            throw new Error("Failed to add Sepolia network to wallet")
          }
        } else {
          console.error("Failed to switch to Sepolia:", switchError)
          throw switchError
        }
      }
    }
  }

  async function connectWallet() {
    try {
      setError(null)
      setTxHash(null)
      
      if (!currentUser) {
        setError("Please sign in first before connecting a wallet.")
        return
      }
      
      if (!window.ethereum) {
        setError("No Ethereum provider found. Install MetaMask or a compatible wallet.")
        return
      }
      
      const provider = new BrowserProvider(window.ethereum)
      await ensureSepolia(provider)
      const accs: string[] = await window.ethereum.request({ method: "eth_requestAccounts" })
      const s = await provider.getSigner()
      setSigner(s)
      setAccount(accs[0] ?? null)
      
      // Save the wallet address to the user's profile in Firestore
      if (accs[0] && currentUser) {
        const userRef = doc(db, "users", currentUser.uid)
        await setDoc(userRef, {
          walletAddress: accs[0].toLowerCase(),
          email: currentUser.email,
          role: currentUser.role,
          updatedAt: serverTimestamp(),
        }, { merge: true })
        
        console.log(`Connected wallet ${accs[0]} to user ${currentUser.email}`)
        
        // NOTE: We don't automatically sync blockchain balance here
        // The user's database balance remains unchanged until they explicitly top up
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect wallet")
    }
  }

  async function chooseAccount() {
    try {
      setError(null)
      setTxHash(null)
      
      if (!currentUser) {
        setError("Please sign in first before connecting a wallet.")
        return
      }
      
      if (!window.ethereum) return
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      })
      const accs: string[] = await window.ethereum.request({ method: "eth_requestAccounts" })
      const provider = new BrowserProvider(window.ethereum)
      await ensureSepolia(provider)
      const s = await provider.getSigner()
      setSigner(s)
      setAccount(accs[0] ?? null)
      
      // Update the wallet address in the user's profile
      if (accs[0] && currentUser) {
        const userRef = doc(db, "users", currentUser.uid)
        await setDoc(userRef, {
          walletAddress: accs[0].toLowerCase(),
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to switch account")
    }
  }

  useEffect(() => {
    if (!window.ethereum || !currentUser) return
    const handler = async (accs: string[]) => {
      const addr = accs[0] ?? null
      setAccount(addr)
      if (addr && signer?.provider) {
        const s = await (signer.provider as BrowserProvider).getSigner()
        setSigner(s)
        
        // Update the wallet address in the user's profile
        const userRef = doc(db, "users", currentUser.uid)
        await setDoc(userRef, {
          walletAddress: addr.toLowerCase(),
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
    }
    window.ethereum.on?.("accountsChanged", handler)
    return () => window.ethereum.removeListener?.("accountsChanged", handler)
  }, [signer, currentUser])

  async function loadBalance(addr: string) {
    if (!contract || !currentUser) return
    try {
      // Get current user balance from database (this is the source of truth)
      const userRef = doc(db, "users", currentUser.uid)
      const userSnap = await getDoc(userRef)
      const currentDbBalance = userSnap.exists() ? (userSnap.data().tokenBalance || 0) : 0
      
      // Display the database balance (user's personal balance)
      setTokenBalanceStr(currentDbBalance.toString())
      
      // Update wallet address in user record
      await setDoc(userRef, {
        walletAddress: addr.toLowerCase(),
        lastChainSyncAt: serverTimestamp(),
      }, { merge: true })
      
      console.log(`Loaded balance for ${currentUser.email}: ${currentDbBalance} tokens (from database)`)
      
      // Optional: Check blockchain balance for information only (don't sync automatically)
      try {
        const blockchainTokens = await contract.tokenBalanceOf(addr)
        const blockchainBalance = Number(blockchainTokens.toString())
        console.log(`Blockchain balance for wallet ${addr}: ${blockchainBalance} tokens`)
        
        if (blockchainBalance !== currentDbBalance) {
          console.log(`Note: Blockchain balance (${blockchainBalance}) differs from user balance (${currentDbBalance})`)
          // We don't automatically sync - this prevents balance theft
        }
      } catch (e) {
        console.error('Could not check blockchain balance:', e)
      }
      
    } catch (e: any) {
      setError(e?.message ?? "Failed to load balance")
    }
  }

  // Subscribe to Firestore for live updates of the current user's token balance
  useEffect(() => {
    if (!currentUser) {
      setTokenBalanceStr("0")
      return
    }
    
    console.log(`Setting up token balance subscription in modal for ${currentUser.email}`)
    
    const userRef = doc(db, "users", currentUser.uid)
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.tokenBalance !== undefined) {
          console.log(`Modal: Token balance updated for ${currentUser.email}: ${data.tokenBalance}`)
          setTokenBalanceStr(data.tokenBalance.toString())
        } else {
          // Document exists but no tokenBalance field, set to 0
          console.log(`Modal: Document exists for ${currentUser.email} but no tokenBalance field`)
          setTokenBalanceStr("0")
        }
        // If user has a saved wallet address, automatically set it (but don't auto-connect)
        if (data.walletAddress && !account) {
          // Just display the saved wallet address, user can choose to connect
          console.log(`User ${currentUser.email} has saved wallet: ${data.walletAddress}`)
        }
      } else {
        // If document doesn't exist, initialize it (this will preserve existing balances)
        console.log(`Modal: No document found for ${currentUser.email}, initializing...`)
        initializeUserDocument(currentUser)
        setTokenBalanceStr("0")
      }
    }, (error) => {
      console.error('Modal: Error listening to token balance:', error)
      setTokenBalanceStr("0")
    })
    
    return () => {
      console.log(`Modal: Cleaning up subscription for ${currentUser.email}`)
      unsub()
    }
  }, [currentUser])

  // Refresh user data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reload user from localStorage in case it changed
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          if (!currentUser || currentUser.uid !== user.uid) {
            console.log(`Modal opened: Updating current user to ${user.email}`)
            setCurrentUser(user)
          }
        } else if (currentUser) {
          console.log('Modal opened: No user in localStorage, clearing current user')
          setCurrentUser(null)
        }
      } catch (e) {
        console.error('Failed to refresh user from localStorage:', e)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && account) loadBalance(account)
  }, [isOpen, account, contract])

  const parsedTokens = useMemo(() => {
    const n = parseInt(topUpAmount || "0", 10)
    return isNaN(n) || n <= 0 ? 0 : n
  }, [topUpAmount])

  const ethCostForTokens = useMemo(() => {
    if (!parsedTokens) return "0 ETH"
    const wei = getWeiPerToken() * BigInt(parsedTokens)
    return `${ethers.formatEther(wei)} ETH`
  }, [parsedTokens])

  const handleTopUp = async () => {
    if (!currentUser) {
      setError("Please sign in first.")
      return
    }
    
    if (!account || !contract) {
      setError("Connect your wallet first.")
      return
    }
    
    const tokens = parsedTokens
    if (!tokens) return

    try {
      setIsLoading(true)
      setError(null)
      setTxHash(null)

      console.log(`${currentUser.email} is topping up ${tokens} tokens...`)

      // Step 1: Get current database balance
      const userRef = doc(db, "users", currentUser.uid)
      const userSnap = await getDoc(userRef)
      const currentDbBalance = userSnap.exists() ? (userSnap.data().tokenBalance || 0) : 0
      
      // Step 2: Perform blockchain transaction
      const valueWei = getWeiPerToken() * BigInt(tokens)
      const tx = await contract.deposit({ value: valueWei })
      setTxHash(tx.hash)
      await tx.wait()

      // Step 3: Update user's database balance (add the new tokens)
      const newBalance = currentDbBalance + tokens
      await setDoc(userRef, {
        tokenBalance: newBalance,
        walletAddress: account.toLowerCase(),
        lastChainSyncAt: serverTimestamp(),
      }, { merge: true })

      console.log(`Top-up successful for ${currentUser.email}: ${currentDbBalance} + ${tokens} = ${newBalance}`)
      
      // Step 4: Update UI and close modal
      setTokenBalanceStr(newBalance.toString())
      setTopUpAmount("")
      onCloseAction()
    } catch (e: any) {
      setError(e?.shortMessage || e?.message || "Transaction failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePredefinedAmount = (amount: number) => setTopUpAmount(amount.toString())

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto scrollbar-hide">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">My Token Balance</DialogTitle>
          <DialogDescription>
            Your personal EDS tokens for AI tutoring sessions and premium features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!currentUser && (
            <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-4 text-center">
              <div className="text-sm font-medium text-yellow-800">
                Please sign in to access your token balance
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                Each user account has its own separate token balance
              </div>
            </div>
          )}

          {currentUser && (
            <div className="flex items-center justify-between rounded-lg border p-3 bg-blue-50">
              <div className="text-sm">
                <div className="font-medium">Signed in as</div>
                <div className="text-muted-foreground">
                  {currentUser.email}
                </div>
              </div>
              <Badge variant="secondary">{currentUser.role}</Badge>
            </div>
          )}

          {/* Wallet connect */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="text-sm">
              <div className="font-medium">Wallet</div>
              <div className="text-muted-foreground">
                {account ? truncate(account) : "Not connected (Sepolia)"}
              </div>
            </div>
            {!currentUser ? (
              <Button disabled className="flex items-center gap-2">
                <PlugZap className="h-4 w-4" /> Sign In First
              </Button>
            ) : !account ? (
              <Button onClick={connectWallet} className="flex items-center gap-2">
                <PlugZap className="h-4 w-4" /> Connect
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={chooseAccount}>
                Change
              </Button>
            )}
          </div>

          {/* Balance */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <img src="/eds-logo.png" className="h-8 w-8 rounded-full" alt="EDS" />
              <span className="text-3xl font-bold">
                {currentUser ? tokenBalanceStr : "--"}
              </span>
              <Badge variant="secondary" className="ml-2">
                <Coins className="h-3 w-3 mr-1" /> EDS
              </Badge>
            </div>
            {!currentUser && (
              <div className="text-xs text-muted-foreground">
                Sign in to view your balance
              </div>
            )}
          </div>

          <Separator />

          {/* Top Up */}
          <div className={`space-y-4 ${!currentUser ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <Label className="text-base font-medium">Top Up Tokens</Label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((amount) => (
                <Button key={amount} variant="outline" size="sm"
                  onClick={() => handlePredefinedAmount(amount)} 
                  className="h-10"
                  disabled={!currentUser}>
                  +{amount}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Custom Amount (tokens)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="pl-8"
                  min={1}
                  disabled={!currentUser}
                />
                <Plus className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-medium text-foreground">Top-up Summary</Label>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Token Value:</span>
                <span className="font-medium text-primary">1 Token = 0.0001 ETH</span>
              </div>
              {parsedTokens > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm pt-2 border-t">
                    <span className="text-muted-foreground">You will receive:</span>
                    <span className="font-semibold text-lg text-primary">{parsedTokens} tokens</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total cost:</span>
                    <span className="font-semibold text-lg text-green-600">{ethCostForTokens}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Feedback */}
          {txHash && (
            <div className="text-xs">
              Tx sent:{" "}
              <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="underline">
                View on Etherscan
              </a>
            </div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onCloseAction}>Cancel</Button>
          <Button
            onClick={handleTopUp}
            disabled={!currentUser || !account || !parsedTokens || isLoading}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {isLoading ? "Processing..." : "Top Up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
