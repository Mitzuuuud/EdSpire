import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

export interface TokenDeductionResult {
  success: boolean
  newBalance?: number
  error?: string
}

/**
 * Deducts tokens from a user's balance
 * @param userId - The user's UID
 * @param amount - The amount of tokens to deduct
 * @param reason - Optional reason for the deduction (e.g., "Session booking", "AI Chat")
 * @returns Promise<TokenDeductionResult>
 */
export async function deductTokens(
  userId: string, 
  amount: number, 
  reason?: string
): Promise<TokenDeductionResult> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    if (amount <= 0) {
      return { success: false, error: "Deduction amount must be positive" }
    }

    const userRef = doc(db, "users", userId)
    
    // Get current user data
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return { success: false, error: "User not found" }
    }

    const userData = userSnap.data()
    const currentBalance = userData.tokenBalance || 0

    // Check if user has sufficient balance
    if (currentBalance < amount) {
      return { 
        success: false, 
        error: `Insufficient balance. Required: ${amount} tokens, Available: ${currentBalance} tokens` 
      }
    }

    // Calculate new balance
    const newBalance = currentBalance - amount

    // Update user's token balance
    await setDoc(userRef, {
      tokenBalance: newBalance,
      lastDeductionAt: serverTimestamp(),
      lastDeductionAmount: amount,
      lastDeductionReason: reason || "Token deduction",
      updatedAt: serverTimestamp(),
    }, { merge: true })

    console.log(`Successfully deducted ${amount} tokens from user ${userId}. New balance: ${newBalance}`)

    return { 
      success: true, 
      newBalance 
    }

  } catch (error: any) {
    console.error('Error deducting tokens:', error)
    return { 
      success: false, 
      error: error?.message || "Failed to deduct tokens" 
    }
  }
}

/**
 * Refunds tokens to a user's balance
 * @param userId - The user's UID
 * @param amount - The amount of tokens to refund
 * @param reason - Optional reason for the refund (e.g., "Booking request rejected")
 * @returns Promise<TokenDeductionResult>
 */
export async function refundTokens(
  userId: string, 
  amount: number, 
  reason?: string
): Promise<TokenDeductionResult> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    if (amount <= 0) {
      return { success: false, error: "Refund amount must be positive" }
    }

    const userRef = doc(db, "users", userId)
    
    // Get current user data
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return { success: false, error: "User not found" }
    }

    const userData = userSnap.data()
    const currentBalance = userData.tokenBalance || 0

    // Calculate new balance
    const newBalance = currentBalance + amount

    // Update user's token balance
    await setDoc(userRef, {
      tokenBalance: newBalance,
      lastRefundAt: serverTimestamp(),
      lastRefundAmount: amount,
      lastRefundReason: reason || "Token refund",
      updatedAt: serverTimestamp(),
    }, { merge: true })

    console.log(`Successfully refunded ${amount} tokens to user ${userId}. New balance: ${newBalance}`)

    return { 
      success: true, 
      newBalance 
    }

  } catch (error: any) {
    console.error('Error refunding tokens:', error)
    return { 
      success: false, 
      error: error?.message || "Failed to refund tokens" 
    }
  }
}

/**
 * Gets the current token balance for a user
 * @param userId - The user's UID
 * @returns Promise<number> - The current token balance
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return 0
    }

    const userData = userSnap.data()
    return userData.tokenBalance || 0

  } catch (error) {
    console.error('Error getting user token balance:', error)
    return 0
  }
}