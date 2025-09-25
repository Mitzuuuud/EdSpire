import { db } from '@/lib/firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp 
} from 'firebase/firestore'

export interface UserProfile {
  uid: string
  email: string
  name: string
  bio?: string
  timezone?: string
  language?: string
  avatar?: string
  role: 'student' | 'tutor' | 'admin'
  createdAt: Date
  updatedAt: Date
  
  // Notification preferences
  notifications: {
    sessionReminders: boolean
    newMessages: boolean
    weeklyProgress: boolean
    tutorUpdates: boolean
    marketingEmails: boolean
  }
  
  // Privacy settings
  privacy: {
    profileVisibility: 'public' | 'tutors' | 'private'
    showProgress: boolean
    allowDirectMessages: boolean
  }
  
  // Additional profile data
  plan?: 'free' | 'premium'
  memberSince?: Date
  totalSessions?: number
  lastActiveAt?: Date
}

export interface UserProfileUpdate {
  name?: string
  bio?: string
  timezone?: string
  language?: string
  avatar?: string
  notifications?: Partial<UserProfile['notifications']>
  privacy?: Partial<UserProfile['privacy']>
  lastActiveAt?: Date
}

// Create or update user profile
export async function createUserProfile(uid: string, profileData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', uid)
    const now = new Date()
    
    const defaultProfile: UserProfile = {
      uid,
      email: profileData.email || '',
      name: profileData.name || '',
      bio: profileData.bio || '',
      timezone: profileData.timezone || 'America/New_York',
      language: profileData.language || 'English',
      avatar: profileData.avatar || '',
      role: profileData.role || 'student',
      createdAt: now,
      updatedAt: now,
      plan: 'free',
      memberSince: now,
      totalSessions: 0,
      lastActiveAt: now,
      notifications: {
        sessionReminders: true,
        newMessages: true,
        weeklyProgress: true,
        tutorUpdates: false,
        marketingEmails: false,
        ...profileData.notifications
      },
      privacy: {
        profileVisibility: 'tutors',
        showProgress: true,
        allowDirectMessages: true,
        ...profileData.privacy
      }
    }
    
    await setDoc(userRef, {
      ...defaultProfile,
      createdAt: Timestamp.fromDate(defaultProfile.createdAt),
      updatedAt: Timestamp.fromDate(defaultProfile.updatedAt),
      memberSince: Timestamp.fromDate(defaultProfile.memberSince || now),
      lastActiveAt: Timestamp.fromDate(defaultProfile.lastActiveAt || now)
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('Error creating user profile:', error)
    return { success: false, error: error.message }
  }
}

// Get user profile by UID
export async function getUserProfile(uid: string): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return { success: false, error: 'User profile not found' }
    }
    
    const data = userSnap.data()
    
    // Convert Firestore timestamps back to Date objects
    const profile: UserProfile = {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      memberSince: data.memberSince?.toDate() || new Date(),
      lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
    } as UserProfile
    
    return { success: true, profile }
  } catch (error: any) {
    console.error('Error getting user profile:', error)
    return { success: false, error: error.message }
  }
}

// Update user profile
export async function updateUserProfile(uid: string, updates: UserProfileUpdate): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', uid)
    
    // Prepare update data
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    }
    
    // Handle nested objects (notifications, privacy)
    if (updates.notifications) {
      Object.keys(updates.notifications).forEach(key => {
        updateData[`notifications.${key}`] = updates.notifications![key as keyof UserProfile['notifications']]
      })
      delete updateData.notifications
    }
    
    if (updates.privacy) {
      Object.keys(updates.privacy).forEach(key => {
        updateData[`privacy.${key}`] = updates.privacy![key as keyof UserProfile['privacy']]
      })
      delete updateData.privacy
    }
    
    // Convert Date to Timestamp if present
    if (updates.lastActiveAt) {
      updateData.lastActiveAt = Timestamp.fromDate(updates.lastActiveAt)
    }
    
    await updateDoc(userRef, updateData)
    
    return { success: true }
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return { success: false, error: error.message }
  }
}

// Delete user account and all associated data
export async function deleteUserAccount(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const batch = writeBatch(db)
    
    // Delete user profile
    const userRef = doc(db, 'users', uid)
    batch.delete(userRef)
    
    // Delete user sessions
    const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', uid))
    const sessionsSnapshot = await getDocs(sessionsQuery)
    sessionsSnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    // Delete user tokens/balance
    const tokensRef = doc(db, 'userTokens', uid)
    batch.delete(tokensRef)
    
    // Delete user availability (if user is a tutor)
    const availabilityQuery = query(collection(db, 'availability'), where('tutorId', '==', uid))
    const availabilitySnapshot = await getDocs(availabilityQuery)
    availabilitySnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    // Commit all deletions
    await batch.commit()
    
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting user account:', error)
    return { success: false, error: error.message }
  }
}

// Update user's last active timestamp
export async function updateLastActive(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      lastActiveAt: Timestamp.fromDate(new Date())
    })
  } catch (error) {
    console.error('Error updating last active:', error)
  }
}

// Get user statistics
export async function getUserStats(uid: string): Promise<{
  totalSessions: number
  completedSessions: number
  upcomingSessions: number
  totalHours: number
}> {
  try {
    const sessionsQuery = query(collection(db, 'sessions'), where('userId', '==', uid))
    const sessionsSnapshot = await getDocs(sessionsQuery)
    
    let totalSessions = 0
    let completedSessions = 0
    let upcomingSessions = 0
    let totalHours = 0
    
    const now = new Date()
    
    sessionsSnapshot.forEach((doc) => {
      const session = doc.data()
      totalSessions++
      
      const startTime = session.startTime?.toDate() || new Date(session.startTime)
      const endTime = session.endTime?.toDate() || new Date(session.endTime)
      
      // Calculate hours
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      totalHours += hours
      
      // Check if completed or upcoming
      if (endTime < now) {
        completedSessions++
      } else if (startTime > now) {
        upcomingSessions++
      }
    })
    
    return {
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalHours: Math.round(totalHours * 10) / 10 // Round to 1 decimal
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      totalSessions: 0,
      completedSessions: 0,
      upcomingSessions: 0,
      totalHours: 0
    }
  }
}