import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore"
import { db } from "./firebase"

export interface BookingRequest {
  id?: string
  studentId: string
  studentName: string
  studentEmail: string
  studentAvatar?: string
  tutorId: string
  tutorName: string
  subject: string
  topic: string
  date: string // YYYY-MM-DD format
  time: string // HH:MM format
  duration: number // in minutes
  message?: string
  status: "pending" | "accepted" | "rejected"
  urgency?: "low" | "medium" | "high"
  cost: number // in tokens
  sessionId?: string // ID of the created session when accepted
  createdAt?: any
  updatedAt?: any
}

export interface BookingRequestResult {
  success: boolean
  requestId?: string
  error?: string
}

/**
 * Create a new booking request
 */
export async function createBookingRequest(requestData: Omit<BookingRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<BookingRequestResult> {
  try {
    console.log('Creating booking request:', requestData)
    
    // Validate required fields
    if (!requestData.studentId || !requestData.tutorId || !requestData.studentEmail) {
      const error = 'Missing required fields: studentId, tutorId, or studentEmail'
      console.error(error, requestData)
      return { success: false, error }
    }

    // Create the request document
    const requestDoc = {
      ...requestData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    console.log('Prepared request document:', requestDoc)

    // Add to the global booking requests collection
    const requestsRef = collection(db, "bookingRequests")
    const docRef = await addDoc(requestsRef, requestDoc)
    
    console.log(`Booking request created successfully! Document ID: ${docRef.id}`)
    
    // Verify the document was created by reading it back
    const createdDoc = await getDocs(query(requestsRef, where("__name__", "==", docRef.id)))
    console.log(`Verification: Found ${createdDoc.size} documents with the created ID`)
    
    return {
      success: true,
      requestId: docRef.id
    }

  } catch (error: any) {
    console.error('Error creating booking request:', error)
    return {
      success: false,
      error: error?.message || "Failed to create booking request"
    }
  }
}

/**
 * Test function to create a sample booking request for debugging
 */
export async function createTestBookingRequest(tutorId: string): Promise<{ success: boolean; error?: string }> {
  const testRequest = {
    studentId: "test-student-id",
    studentName: "Test Student",
    studentEmail: "test@example.com",
    tutorId: tutorId,
    tutorName: "Test Tutor",
    subject: "Test Subject",
    topic: "Test Topic",
    date: new Date().toISOString().split('T')[0],
    time: "14:00",
    duration: 60,
    message: "This is a test booking request",
    status: 'pending' as const,
    urgency: 'medium' as const,
    cost: 20,
  }
  
  return await createBookingRequest(testRequest)
}

/**
 * Get ALL booking requests for debugging purposes
 */
export async function getAllBookingRequests(): Promise<BookingRequest[]> {
  try {
    console.log('Getting ALL booking requests for debugging')
    
    const requestsRef = collection(db, "bookingRequests")
    const querySnapshot = await getDocs(requestsRef)
    const requests: BookingRequest[] = []
    
    console.log(`Found ${querySnapshot.size} total booking request documents`)
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const request = {
        id: doc.id,
        ...data,
      } as BookingRequest
      
      console.log(`All Request ${doc.id}:`, {
        id: request.id,
        status: request.status,
        tutorId: request.tutorId,
        studentName: request.studentName,
        subject: request.subject,
        createdAt: request.createdAt
      })
      requests.push(request)
    })
    
    return requests
    
  } catch (error) {
    console.error('Error getting all booking requests:', error)
    return []
  }
}

/**
 * Get booking requests for a specific tutor
 */
export async function getTutorBookingRequests(tutorId: string): Promise<BookingRequest[]> {
  try {
    console.log(`Getting booking requests for tutor: ${tutorId}`)
    
    const requestsRef = collection(db, "bookingRequests")
    // First get all requests for this tutor (without ordering)
    const q = query(
      requestsRef,
      where("tutorId", "==", tutorId)
    )
    
    const querySnapshot = await getDocs(q)
    const requests: BookingRequest[] = []
    
    console.log(`Found ${querySnapshot.size} booking request documents for tutor ${tutorId}`)
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const request = {
        id: doc.id,
        ...data,
      } as BookingRequest
      
      console.log(`Request ${doc.id}:`, {
        id: request.id,
        status: request.status,
        studentName: request.studentName,
        subject: request.subject,
        createdAt: request.createdAt
      })
      requests.push(request)
    })
    
    // Sort by createdAt in JavaScript instead of Firestore
    requests.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0
      const bTime = b.createdAt?.seconds || 0
      return bTime - aTime // Descending order
    })
    
    console.log(`Returning ${requests.length} requests for tutor ${tutorId}`)
    console.log(`Status breakdown:`, {
      pending: requests.filter(r => r.status === 'pending').length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    })
    
    return requests
    
  } catch (error) {
    console.error('Error getting tutor booking requests:', error)
    return []
  }
}

/**
 * Get booking requests for a specific student
 */
export async function getStudentBookingRequests(studentId: string): Promise<BookingRequest[]> {
  try {
    console.log(`Getting booking requests for student: ${studentId}`)
    
    const requestsRef = collection(db, "bookingRequests")
    // First get all requests for this student (without ordering)
    const q = query(
      requestsRef,
      where("studentId", "==", studentId)
    )
    
    const querySnapshot = await getDocs(q)
    const requests: BookingRequest[] = []
    
    console.log(`Found ${querySnapshot.size} booking request documents`)
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const request = {
        id: doc.id,
        ...data,
      } as BookingRequest
      
      console.log(`Request ${doc.id}:`, {
        id: request.id,
        status: request.status,
        studentName: request.studentName,
        subject: request.subject,
        createdAt: request.createdAt
      })
      requests.push(request)
    })
    
    // Sort by createdAt in JavaScript instead of Firestore
    requests.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0
      const bTime = b.createdAt?.seconds || 0
      return bTime - aTime // Descending order
    })
    
    console.log(`Returning ${requests.length} requests for student ${studentId}`)
    return requests
    
  } catch (error) {
    console.error('Error getting student booking requests:', error)
    return []
  }
}

/**
 * Update booking request status (accept/reject)
 */
export async function updateBookingRequestStatus(
  requestId: string, 
  status: "accepted" | "rejected",
  sessionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`=== UPDATING BOOKING REQUEST ${requestId} ===`)
    console.log(`Status: ${status}, SessionId: ${sessionId}`)
    
    // First, let's check if the document exists
    console.log('Checking if document exists...')
    const checkDoc = await getDocs(query(collection(db, "bookingRequests"), where("__name__", "==", requestId)))
    if (checkDoc.size === 0) {
      console.error(`Document ${requestId} not found in database!`)
      return {
        success: false,
        error: `Document ${requestId} not found in database`
      }
    }
    console.log(`Document ${requestId} exists in database`)
    
    const requestRef = doc(db, "bookingRequests", requestId)
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    }
    
    // If accepting and we have a session ID, store it
    if (status === "accepted" && sessionId) {
      updateData.sessionId = sessionId
      console.log('Adding sessionId to update data:', sessionId)
    }
    
    console.log('Update data:', updateData)
    console.log('Document reference:', requestRef.path)
    
    await updateDoc(requestRef, updateData)
    console.log(`Booking request ${requestId} updated to ${status} successfully`)
    
    // Verify the update by reading the document back
    console.log('Verifying update...')
    const updatedDoc = await getDocs(query(collection(db, "bookingRequests"), where("__name__", "==", requestId)))
    if (updatedDoc.size > 0) {
      const docData = updatedDoc.docs[0].data()
      console.log(`Verification: Document ${requestId} now has status: ${docData.status}`)
      console.log(`Verification: Document ${requestId} sessionId: ${docData.sessionId}`)
    } else {
      console.error(`Verification failed: Document ${requestId} not found after update!`)
    }
    
    return { success: true }
    
  } catch (error: any) {
    console.error('Error updating booking request status:', error)
    console.error('Error details:', error.code, error.message)
    return {
      success: false,
      error: error?.message || "Failed to update booking request status"
    }
  }
}

/**
 * Convert accepted booking request to a scheduled session
 */
export async function convertRequestToSession(request: BookingRequest): Promise<{ success: boolean; error?: string; sessionId?: string }> {
  try {
    console.log(`Converting booking request ${request.id} to session`)
    
    // Import the session booking function
    const { bookSession, createSessionTimes } = await import('./session-booking')
    
    // Create session times from the request
    const { startTime, endTime } = createSessionTimes(
      request.date, 
      request.time, 
      request.duration / 60 // convert minutes to hours
    )
    
    // Create session data
    const sessionData = {
      userId: request.studentId,
      tutorId: request.tutorId,
      tutorName: request.tutorName,
      studentEmail: request.studentEmail,
      subject: request.subject,
      startTime,
      endTime,
      date: request.date,
      status: 'scheduled' as const,
      cost: request.cost,
      notes: request.message || undefined,
    }
    
    console.log('Session data to create:', sessionData)
    
    // Book the session for the student
    const studentResult = await bookSession(sessionData)
    
    if (!studentResult.success) {
      console.error('Failed to create session from request:', studentResult.error)
      return { success: false, error: studentResult.error }
    }
    
    // Also create a session for the tutor
    const tutorSessionData = {
      ...sessionData,
      userId: request.tutorId, // Create session for tutor
      studentEmail: request.studentEmail,
      tutorName: request.tutorName,
      // Store reference to the student session for easy cancellation sync
      studentSessionId: studentResult.sessionId,
    }
    
    console.log('Creating tutor session with data:', tutorSessionData)
    const tutorResult = await bookSession(tutorSessionData)
    
    if (!tutorResult.success) {
      console.error('Failed to create tutor session from request:', tutorResult.error)
      // Don't fail the whole operation if tutor session creation fails
      console.warn('Student session created but tutor session failed')
    } else {
      console.log(`Successfully created tutor session ${tutorResult.sessionId} for tutor ${request.tutorId}`)
      console.log('Tutor session will appear in tutor schedule calendar')
      
      // Also store reference to tutor session in student session for reverse lookup
      try {
        const { doc, updateDoc } = await import("firebase/firestore")
        const studentSessionRef = doc(db, "users", request.studentId, "sessions", studentResult.sessionId)
        await updateDoc(studentSessionRef, {
          tutorSessionId: tutorResult.sessionId
        })
        console.log(`Stored tutor session reference in student session`)
      } catch (refError) {
        console.error('Failed to store tutor session reference:', refError)
        // Don't fail the operation for this
      }
    }
    
    console.log(`Successfully converted request ${request.id} to session ${studentResult.sessionId}`)
    
    return { success: true, sessionId: studentResult.sessionId }
    
  } catch (error: any) {
    console.error('Error converting request to session:', error)
    return {
      success: false,
      error: error?.message || "Failed to convert request to session"
    }
  }
}
