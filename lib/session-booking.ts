import { doc, setDoc, collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "./firebase"

export interface BookedSession {
  id?: string
  userId: string
  tutorId: string
  tutorName: string
  studentEmail: string
  subject: string
  startTime: Date
  endTime: Date
  date: string // YYYY-MM-DD format
  status: 'scheduled' | 'completed' | 'cancelled'
  cost: number
  notes?: string
  createdAt?: any
  updatedAt?: any
}

export interface BookSessionResult {
  success: boolean
  sessionId?: string
  error?: string
}

/**
 * Books a session and saves it to the database as a subcollection under the user
 * @param sessionData - The session details to book
 * @returns Promise<BookSessionResult>
 */
export async function bookSession(sessionData: Omit<BookedSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<BookSessionResult> {
  try {
    console.log('bookSession called with data:', sessionData)
    
    // Validate required fields
    if (!sessionData.userId || !sessionData.tutorId || !sessionData.studentEmail) {
      const error = 'Missing required fields: userId, tutorId, or studentEmail'
      console.error(error, sessionData)
      return { success: false, error }
    }

    // Create the session document
    const sessionDoc = {
      ...sessionData,
      startTime: Timestamp.fromDate(sessionData.startTime),
      endTime: Timestamp.fromDate(sessionData.endTime),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    console.log('Prepared session document:', sessionDoc)
    console.log('Database reference:', db)

    // Add to the user's 'sessions' subcollection: users/{userId}/sessions/{sessionId}
    console.log(`Adding document to users/${sessionData.userId}/sessions subcollection...`)
    const userSessionsRef = collection(db, "users", sessionData.userId, "sessions")
    const docRef = await addDoc(userSessionsRef, sessionDoc)
    
    console.log(`Session booked successfully! Document ID: ${docRef.id}`)
    console.log('Document reference:', docRef)
    
    return {
      success: true,
      sessionId: docRef.id
    }

  } catch (error: any) {
    console.error('Error booking session:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return {
      success: false,
      error: error?.message || "Failed to book session"
    }
  }
}

/**
 * Helper function to parse time string (e.g., "14:00") and create a Date object
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format
 * @param durationHours - Duration in hours (default 1)
 * @returns { startTime: Date, endTime: Date }
 */
export function createSessionTimes(dateStr: string, timeStr: string, durationHours: number = 1): { startTime: Date, endTime: Date } {
  const [hours, minutes] = timeStr.split(':').map(Number)
  
  const startTime = new Date(dateStr)
  startTime.setHours(hours, minutes, 0, 0)
  
  const endTime = new Date(startTime)
  endTime.setTime(endTime.getTime() + (durationHours * 60 * 60 * 1000))
  
  return { startTime, endTime }
}

/**
 * Get user's booked sessions from their subcollection
 * @param userId - The user's UID
 * @returns Promise<BookedSession[]>
 */
export async function getUserSessions(userId: string): Promise<BookedSession[]> {
  try {
    const { getDocs, query, orderBy } = await import("firebase/firestore")
    
    console.log(`Getting sessions for user: ${userId}`)
    
    // Query the user's sessions subcollection: users/{userId}/sessions
    const userSessionsRef = collection(db, "users", userId, "sessions")
    const q = query(
      userSessionsRef,
      orderBy("startTime", "desc")
    )
    
    console.log('Querying user sessions subcollection...')
    const querySnapshot = await getDocs(q)
    const sessions: BookedSession[] = []
    
    console.log(`Found ${querySnapshot.size} session documents`)
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const session = {
        id: doc.id,
        ...data,
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
      } as BookedSession
      
      console.log(`Session ${doc.id}:`, session)
      sessions.push(session)
    })
    
    console.log(`Returning ${sessions.length} sessions for user ${userId}`)
    return sessions
    
  } catch (error) {
    console.error('Error getting user sessions:', error)
    return []
  }
}

/**
 * Cancel a session and refund tokens to the user's balance
 * @param userId - The user's UID
 * @param sessionId - The session ID to cancel
 * @returns Promise<{success: boolean, error?: string, refundAmount?: number, newBalance?: number}>
 */
export async function cancelSession(userId: string, sessionId: string): Promise<{success: boolean, error?: string, refundAmount?: number, newBalance?: number}> {
  try {
    const { deleteDoc, doc, getDoc, runTransaction } = await import("firebase/firestore")
    
    console.log(`Canceling session ${sessionId} for user ${userId}`)
    
    // Use a transaction to ensure both operations succeed or fail together
    const result = await runTransaction(db, async (transaction) => {
      // Get session details first to know the refund amount
      const sessionDocRef = doc(db, "users", userId, "sessions", sessionId)
      const sessionDoc = await transaction.get(sessionDocRef)
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found')
      }
      
      const sessionData = sessionDoc.data()
      const refundAmount = sessionData.cost || 0
      
      console.log(`Session cost to refund: ${refundAmount} tokens`)
      
      // Get current user balance
      const userDocRef = doc(db, "users", userId)
      const userDoc = await transaction.get(userDocRef)
      
      if (!userDoc.exists()) {
        throw new Error('User not found')
      }
      
      const currentBalance = userDoc.data().tokenBalance || 0
      const newBalance = currentBalance + refundAmount
      
      console.log(`Current balance: ${currentBalance}, Refund: ${refundAmount}, New balance: ${newBalance}`)
      
      // Update user's token balance (refund)
      transaction.update(userDocRef, {
        tokenBalance: newBalance,
        lastUpdated: new Date()
      })
      
      // Delete the session
      transaction.delete(sessionDocRef)
      
      return { refundAmount, newBalance }
    })
    
    console.log(`Session ${sessionId} canceled successfully. Refunded ${result.refundAmount} tokens. New balance: ${result.newBalance}`)
    
    return {
      success: true,
      refundAmount: result.refundAmount,
      newBalance: result.newBalance
    }
    
  } catch (error: any) {
    console.error('Error canceling session:', error)
    return {
      success: false,
      error: error?.message || 'Failed to cancel session'
    }
  }
}