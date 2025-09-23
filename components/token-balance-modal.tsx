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
import { getFirestore, doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore"

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

  const predefinedAmounts = [10, 25, 50, 100, 250, 500]

  const contract = useMemo(() => {
    if (!signer) return null
    return new Contract(GATEWAY_ADDRESS, GATEWAY_ABI, signer)
  }, [signer])

  async function ensureSepolia(provider: BrowserProvider) {
    const net = await provider.getNetwork()
    if (Number(net.chainId) !== 11155111) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      })
    }
  }

  async function connectWallet() {
    try {
      setError(null)
      setTxHash(null)
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
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect wallet")
    }
  }

  async function chooseAccount() {
    try {
      setError(null)
      setTxHash(null)
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
    } catch (e: any) {
      setError(e?.message ?? "Failed to switch account")
    }
  }

  useEffect(() => {
    if (!window.ethereum) return
    const handler = async (accs: string[]) => {
      const addr = accs[0] ?? null
      setAccount(addr)
      if (addr && signer?.provider) {
        const s = await (signer.provider as BrowserProvider).getSigner()
        setSigner(s)
      }
    }
    window.ethereum.on?.("accountsChanged", handler)
    return () => window.ethereum.removeListener?.("accountsChanged", handler)
  }, [signer])

  async function loadBalance(addr: string) {
    if (!contract) return
    try {
      const tokens = await contract.tokenBalanceOf(addr)
      setTokenBalanceStr(tokens.toString())

      // also push to Firestore
      const ref = doc(db, "users", addr.toLowerCase())
      await setDoc(ref, {
        tokenBalance: Number(tokens.toString()),
        lastChainSyncAt: serverTimestamp(),
      }, { merge: true })
    } catch (e: any) {
      setError(e?.message ?? "Failed to load balance")
    }
  }

  // Subscribe to Firestore for live updates
  useEffect(() => {
    if (!account) return
    const ref = doc(db, "users", account.toLowerCase())
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        if (data.tokenBalance !== undefined) {
          setTokenBalanceStr(data.tokenBalance.toString())
        }
      }
    })
    return () => unsub()
  }, [account])

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

      const valueWei = getWeiPerToken() * BigInt(tokens)
      const tx = await contract.deposit({ value: valueWei })
      setTxHash(tx.hash)
      await tx.wait()

      setTopUpAmount("")
      await loadBalance(account)
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
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">Token Balance</DialogTitle>
          <DialogDescription>
            Manage your EDS tokens for AI tutoring sessions and premium features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet connect */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="text-sm">
              <div className="font-medium">Wallet</div>
              <div className="text-muted-foreground">
                {account ? truncate(account) : "Not connected (Sepolia)"}
              </div>
            </div>
            {!account ? (
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
              <span className="text-3xl font-bold">{tokenBalanceStr}</span>
              <Badge variant="secondary" className="ml-2">
                <Coins className="h-3 w-3 mr-1" /> EDS
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Current token balance (live from Firestore)</p>
          </div>

          <Separator />

          {/* Top Up */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <Label className="text-base font-medium">Top Up Tokens</Label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((amount) => (
                <Button key={amount} variant="outline" size="sm"
                  onClick={() => handlePredefinedAmount(amount)} className="h-10">
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
            disabled={!account || !parsedTokens || isLoading}
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
