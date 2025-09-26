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
  onSnapshot,
  Timestamp 
} from "firebase/firestore"
import { db } from "./firebase"

export interface ChatMessage {
  id?: string
  roomId: string
  senderId: string
  senderName: string
  senderEmail: string
  content: string
  timestamp: any
  messageType: "text" | "system"
}

export interface ChatRoom {
  id?: string
  sessionId?: string // Optional for non-session chats
  chatType: "session" | "student" | "general" // Type of chat room
  participants: ChatParticipant[] // Array of all participants
  subject?: string // For session chats
  title: string // Display title for the chat
  status: "active" | "archived"
  createdAt: any
  lastMessageAt?: any
  lastMessage?: string
  createdBy: string // User who created the chat
}

export interface ChatParticipant {
  userId: string
  name: string
  email: string
  role: "student" | "tutor" | "admin"
  joinedAt: any
  isActive: boolean
}

export interface CreateChatRoomResult {
  success: boolean
  roomId?: string
  error?: string
}

/**
 * Create a chat room for a session
 */
export async function createChatRoom(sessionData: {
  sessionId: string
  studentId: string
  studentName: string
  studentEmail: string
  tutorId: string
  tutorName: string
  tutorEmail: string
  subject: string
}): Promise<CreateChatRoomResult> {
  try {
    
    const participants: ChatParticipant[] = [
      {
        userId: sessionData.studentId,
        name: sessionData.studentName,
        email: sessionData.studentEmail,
        role: "student",
        joinedAt: new Date(),
        isActive: true
      },
      {
        userId: sessionData.tutorId,
        name: sessionData.tutorName,
        email: sessionData.tutorEmail,
        role: "tutor",
        joinedAt: new Date(),
        isActive: true
      }
    ]
    
    const roomData: Omit<ChatRoom, 'id'> = {
      sessionId: sessionData.sessionId,
      chatType: "session",
      participants,
      subject: sessionData.subject,
      title: `${sessionData.subject} Session - ${sessionData.studentName} & ${sessionData.tutorName}`,
      status: "active",
      createdAt: serverTimestamp(),
      createdBy: sessionData.studentId
    }
    
    const roomRef = await addDoc(collection(db, "chatRooms"), roomData)
    
    // Add a welcome message
    await addMessage(roomRef.id, {
      senderId: "system",
      senderName: "System",
      senderEmail: "system@edspire.com",
      content: `Chat room created for ${sessionData.subject} session. You can now communicate with your ${sessionData.tutorName}.`,
      messageType: "system"
    })
    
    return { success: true, roomId: roomRef.id }
    
  } catch (error: any) {
    console.error('Error creating chat room:', error)
    return {
      success: false,
      error: error?.message || "Failed to create chat room"
    }
  }
}

/**
 * Create a student-to-student chat room
 */
export async function createStudentChatRoom(participants: {
  userId1: string
  name1: string
  email1: string
  userId2: string
  name2: string
  email2: string
  subject?: string
}): Promise<CreateChatRoomResult> {
  try {
    console.log('Creating student chat room between:', participants.name1, 'and', participants.name2)
    
    const chatParticipants: ChatParticipant[] = [
      {
        userId: participants.userId1,
        name: participants.name1,
        email: participants.email1,
        role: "student",
        joinedAt: serverTimestamp(),
        isActive: true
      },
      {
        userId: participants.userId2,
        name: participants.name2,
        email: participants.email2,
        role: "student",
        joinedAt: serverTimestamp(),
        isActive: true
      }
    ]
    
    const roomData: Omit<ChatRoom, 'id'> = {
      chatType: "student",
      participants: chatParticipants,
      subject: participants.subject,
      title: participants.subject 
        ? `${participants.subject} Study Group - ${participants.name1} & ${participants.name2}`
        : `Study Chat - ${participants.name1} & ${participants.name2}`,
      status: "active",
      createdAt: serverTimestamp(),
      createdBy: participants.userId1
    }
    
    const roomRef = await addDoc(collection(db, "chatRooms"), roomData)
    console.log(`Student chat room created with ID: ${roomRef.id}`)
    
    // Add a welcome message
    await addMessage(roomRef.id, {
      senderId: "system",
      senderName: "System",
      senderEmail: "system@edspire.com",
      content: `Study chat started! You can now collaborate and discuss ${participants.subject || 'your studies'} together.`,
      messageType: "system"
    })
    
    return { success: true, roomId: roomRef.id }
    
  } catch (error: any) {
    console.error('Error creating student chat room:', error)
    return {
      success: false,
      error: error?.message || "Failed to create student chat room"
    }
  }
}

/**
 * Create a general chat room for all students
 */
export async function createGeneralChatRoom(): Promise<CreateChatRoomResult> {
  try {
    console.log('Creating general chat room')
    
    const roomData: Omit<ChatRoom, 'id'> = {
      chatType: "general",
      participants: [], // Will be populated as users join
      title: "General Discussion",
      status: "active",
      createdAt: serverTimestamp(),
      createdBy: "system"
    }
    
    const roomRef = await addDoc(collection(db, "chatRooms"), roomData)
    console.log(`General chat room created with ID: ${roomRef.id}`)
    
    // Add a welcome message
    await addMessage(roomRef.id, {
      senderId: "system",
      senderName: "System",
      senderEmail: "system@edspire.com",
      content: "Welcome to the general discussion room! Chat with other students and share your learning experiences.",
      messageType: "system"
    })
    
    return { success: true, roomId: roomRef.id }
    
  } catch (error: any) {
    console.error('Error creating general chat room:', error)
    return {
      success: false,
      error: error?.message || "Failed to create general chat room"
    }
  }
}

/**
 * Add a message to a chat room
 */
export async function addMessage(roomId: string, messageData: {
  senderId: string
  senderName: string
  senderEmail: string
  content: string
  messageType?: "text" | "system"
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message: Omit<ChatMessage, 'id'> = {
      roomId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      senderEmail: messageData.senderEmail,
      content: messageData.content,
      timestamp: serverTimestamp(),
      messageType: messageData.messageType || "text"
    }
    
    const messageRef = await addDoc(collection(db, "chatRooms", roomId, "messages"), message)
    
    // Update room's last message info
    await updateDoc(doc(db, "chatRooms", roomId), {
      lastMessage: messageData.content,
      lastMessageAt: serverTimestamp()
    })
    
    return { success: true, messageId: messageRef.id }
    
  } catch (error: any) {
    console.error('Error adding message:', error)
    return {
      success: false,
      error: error?.message || "Failed to add message"
    }
  }
}

/**
 * Get chat rooms for a user (student or tutor)
 */
export async function getUserChatRooms(userId: string): Promise<ChatRoom[]> {
  try {
    console.log(`Getting chat rooms for user: ${userId}`)
    
    const roomsRef = collection(db, "chatRooms")
    const q = query(
      roomsRef,
      where("status", "==", "active")
    )
    
    const roomsSnapshot = await getDocs(q)
    const userRooms: ChatRoom[] = []
    
    roomsSnapshot.forEach((doc) => {
      const roomData = doc.data() as ChatRoom
      
      // Check if user is a participant in this room
      const isParticipant = roomData.participants?.some(
        participant => participant.userId === userId
      )
      
      if (isParticipant) {
        userRooms.push({
          id: doc.id,
          ...roomData
        })
      }
    })
    
    // Sort by last message time
    userRooms.sort((a, b) => {
      const aTime = a.lastMessageAt?.seconds || a.createdAt?.seconds || 0
      const bTime = b.lastMessageAt?.seconds || b.createdAt?.seconds || 0
      return bTime - aTime
    })
    
    console.log(`Found ${userRooms.length} chat rooms for user ${userId}`)
    return userRooms
    
  } catch (error) {
    console.error('Error getting user chat rooms:', error)
    return []
  }
}

/**
 * Get messages for a chat room
 */
export async function getChatMessages(roomId: string): Promise<ChatMessage[]> {
  try {
    console.log(`Getting messages for room: ${roomId}`)
    
    const messagesRef = collection(db, "chatRooms", roomId, "messages")
    const q = query(messagesRef, orderBy("timestamp", "asc"))
    
    const messagesSnapshot = await getDocs(q)
    const messages: ChatMessage[] = []
    
    messagesSnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as ChatMessage)
    })
    
    console.log(`Found ${messages.length} messages in room ${roomId}`)
    return messages
    
  } catch (error) {
    console.error('Error getting chat messages:', error)
    return []
  }
}

/**
 * Subscribe to real-time messages for a chat room
 */
export function subscribeToChatMessages(roomId: string, callback: (messages: ChatMessage[]) => void) {
  console.log(`Subscribing to messages for room: ${roomId}`)
  
  const messagesRef = collection(db, "chatRooms", roomId, "messages")
  const q = query(messagesRef, orderBy("timestamp", "asc"))
  
  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = []
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as ChatMessage)
    })
    callback(messages)
  })
}

/**
 * Get a specific chat room by ID
 */
export async function getChatRoom(roomId: string): Promise<ChatRoom | null> {
  try {
    const roomDoc = await getDocs(query(collection(db, "chatRooms"), where("__name__", "==", roomId)))
    
    if (roomDoc.size === 0) {
      return null
    }
    
    const roomData = roomDoc.docs[0].data()
    return {
      id: roomDoc.docs[0].id,
      ...roomData
    } as ChatRoom
    
  } catch (error) {
    console.error('Error getting chat room:', error)
    return null
  }
}

/**
 * Join a user to a general chat room
 */
export async function joinGeneralChatRoom(userId: string, userName: string, userEmail: string, userRole: "student" | "tutor" | "admin"): Promise<{ success: boolean; roomId?: string; error?: string }> {
  try {
    console.log(`Joining user ${userId} to general chat room`)
    
    // First, try to find an existing general chat room
    const roomsRef = collection(db, "chatRooms")
    const generalQ = query(
      roomsRef,
      where("chatType", "==", "general"),
      where("status", "==", "active")
    )
    
    const generalRoomsSnapshot = await getDocs(generalQ)
    
    let roomId: string
    
    if (generalRoomsSnapshot.size > 0) {
      // Use existing general chat room
      roomId = generalRoomsSnapshot.docs[0].id
      const roomData = generalRoomsSnapshot.docs[0].data() as ChatRoom
      
      // Check if user is already a participant
      const isAlreadyParticipant = roomData.participants?.some(
        participant => participant.userId === userId
      )
      
      if (!isAlreadyParticipant) {
        // Add user to existing room
        const newParticipant: ChatParticipant = {
          userId,
          name: userName,
          email: userEmail,
          role: userRole,
          joinedAt: serverTimestamp(),
          isActive: true
        }
        
        await updateDoc(doc(db, "chatRooms", roomId), {
          participants: [...(roomData.participants || []), newParticipant]
        })
        
        console.log(`User ${userId} added to existing general chat room`)
      }
    } else {
      // Create new general chat room
      const result = await createGeneralChatRoom()
      if (!result.success) {
        return result
      }
      roomId = result.roomId!
      
      // Add user to the new room
      const newParticipant: ChatParticipant = {
        userId,
        name: userName,
        email: userEmail,
        role: userRole,
        joinedAt: serverTimestamp(),
        isActive: true
      }
      
      await updateDoc(doc(db, "chatRooms", roomId), {
        participants: [newParticipant]
      })
      
      console.log(`User ${userId} added to new general chat room`)
    }
    
    return { success: true, roomId }
    
  } catch (error: any) {
    console.error('Error joining general chat room:', error)
    return {
      success: false,
      error: error?.message || "Failed to join general chat room"
    }
  }
}

/**
 * Find or create a student-to-student chat room
 */
export async function findOrCreateStudentChat(
  userId1: string, 
  name1: string, 
  email1: string,
  userId2: string, 
  name2: string, 
  email2: string,
  subject?: string
): Promise<CreateChatRoomResult> {
  try {
    console.log(`Finding or creating student chat between ${name1} and ${name2}`)
    
    // First, check if a chat room already exists between these two students
    const roomsRef = collection(db, "chatRooms")
    const existingQ = query(
      roomsRef,
      where("chatType", "==", "student"),
      where("status", "==", "active")
    )
    
    const existingRoomsSnapshot = await getDocs(existingQ)
    
    for (const doc of existingRoomsSnapshot.docs) {
      const roomData = doc.data() as ChatRoom
      const participants = roomData.participants || []
      
      // Check if both users are participants
      const hasUser1 = participants.some(p => p.userId === userId1)
      const hasUser2 = participants.some(p => p.userId === userId2)
      
      if (hasUser1 && hasUser2) {
        console.log(`Found existing student chat room: ${doc.id}`)
        return { success: true, roomId: doc.id }
      }
    }
    
    // No existing room found, create a new one
    return await createStudentChatRoom({
      userId1,
      name1,
      email1,
      userId2,
      name2,
      email2,
      subject
    })
    
  } catch (error: any) {
    console.error('Error finding or creating student chat:', error)
    return {
      success: false,
      error: error?.message || "Failed to find or create student chat"
    }
  }
}
