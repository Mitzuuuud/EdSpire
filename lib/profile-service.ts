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
  
  // Tutor-specific data
  tutorProfile?: TutorProfile
}

export interface TutorProfile {
  // Basic tutor info
  title?: string // Dr., Prof., etc.
  yearsOfExperience?: number
  hourlyRate?: number
  
  // Expertise and specialties
  subjects: string[] // Math, Physics, Chemistry, etc.
  specialties: string[] // Test Prep, Homework Help, Advanced Topics, etc.
  expertise: string[] // Calculus, Algebra, Organic Chemistry, etc.
  
  // Education and credentials
  education?: {
    degree: string
    institution: string
    year?: number
  }[]
  certifications?: string[]
  
  // Availability settings
  availabilitySettings: {
    timezone: string
    minSessionDuration: number // in minutes
    maxSessionDuration: number // in minutes
    advanceBookingDays: number // how many days in advance can students book
    bufferTime: number // minutes between sessions
  }
  
  // Profile completion
  profileCompleted: boolean
  setupStep: number // 0 = not started, 1 = basic info, 2 = expertise, 3 = availability, 4 = completed
}

export interface AvailabilitySlot {
  id: string
  tutorId: string
  startTime: Date
  endTime: Date
  isBooked: boolean
  studentId?: string
  sessionId?: string
  recurring?: {
    type: 'weekly' | 'daily'
    endDate?: Date
  }
  timezone: string
  note?: string
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

// ===== TUTOR-SPECIFIC FUNCTIONS =====

// Create or update tutor profile
export async function createTutorProfile(uid: string, tutorData: Partial<TutorProfile>): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', uid)
    
    const defaultTutorProfile: TutorProfile = {
      title: tutorData.title || '',
      yearsOfExperience: tutorData.yearsOfExperience || 0,
      hourlyRate: tutorData.hourlyRate || 25,
      subjects: tutorData.subjects || [],
      specialties: tutorData.specialties || [],
      expertise: tutorData.expertise || [],
      education: tutorData.education || [],
      certifications: tutorData.certifications || [],
      availabilitySettings: {
        timezone: tutorData.availabilitySettings?.timezone || 'America/New_York',
        minSessionDuration: tutorData.availabilitySettings?.minSessionDuration || 30,
        maxSessionDuration: tutorData.availabilitySettings?.maxSessionDuration || 120,
        advanceBookingDays: tutorData.availabilitySettings?.advanceBookingDays || 14,
        bufferTime: tutorData.availabilitySettings?.bufferTime || 15,
        ...tutorData.availabilitySettings
      },
      profileCompleted: tutorData.profileCompleted || false,
      setupStep: tutorData.setupStep || 0
    }
    
    await updateDoc(userRef, {
      tutorProfile: defaultTutorProfile,
      updatedAt: Timestamp.fromDate(new Date())
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('Error creating tutor profile:', error)
    return { success: false, error: error.message }
  }
}

// Update tutor profile
export async function updateTutorProfile(uid: string, updates: Partial<TutorProfile>): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', uid)
    
    // Prepare update data with nested field updates
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date())
    }
    
    // Handle nested tutorProfile updates
    Object.keys(updates).forEach(key => {
      if (key === 'availabilitySettings' && updates.availabilitySettings) {
        // Handle nested availabilitySettings
        Object.keys(updates.availabilitySettings).forEach(settingKey => {
          updateData[`tutorProfile.availabilitySettings.${settingKey}`] = updates.availabilitySettings![settingKey as keyof TutorProfile['availabilitySettings']]
        })
      } else {
        updateData[`tutorProfile.${key}`] = updates[key as keyof TutorProfile]
      }
    })
    
    await updateDoc(userRef, updateData)
    
    return { success: true }
  } catch (error: any) {
    console.error('Error updating tutor profile:', error)
    return { success: false, error: error.message }
  }
}

// Get tutor profile
export async function getTutorProfile(uid: string): Promise<{ success: boolean; tutorProfile?: TutorProfile; error?: string }> {
  try {
    const profileResult = await getUserProfile(uid)
    
    if (!profileResult.success || !profileResult.profile) {
      return { success: false, error: profileResult.error || 'User profile not found' }
    }
    
    const tutorProfile = profileResult.profile.tutorProfile
    
    if (!tutorProfile) {
      return { success: false, error: 'Tutor profile not found' }
    }
    
    return { success: true, tutorProfile }
  } catch (error: any) {
    console.error('Error getting tutor profile:', error)
    return { success: false, error: error.message }
  }
}

// ===== AVAILABILITY FUNCTIONS =====

// Create availability slot
export async function createAvailabilitySlot(slotData: Omit<AvailabilitySlot, 'id'>): Promise<{ success: boolean; slotId?: string; error?: string }> {
  try {
    const availabilityRef = collection(db, 'users', slotData.tutorId, 'availability')
    const docRef = doc(availabilityRef)
    
    const slot: AvailabilitySlot = {
      id: docRef.id,
      ...slotData
    }
    
    await setDoc(docRef, {
      ...slot,
      startTime: Timestamp.fromDate(slot.startTime),
      endTime: Timestamp.fromDate(slot.endTime),
      recurring: slot.recurring ? {
        ...slot.recurring,
        endDate: slot.recurring.endDate ? Timestamp.fromDate(slot.recurring.endDate) : null
      } : null
    })
    
    return { success: true, slotId: docRef.id }
  } catch (error: any) {
    console.error('Error creating availability slot:', error)
    return { success: false, error: error.message }
  }
}

// Get tutor availability
export async function getTutorAvailability(tutorId: string, startDate?: Date, endDate?: Date): Promise<{ success: boolean; slots?: AvailabilitySlot[]; error?: string }> {
  try {
    const availabilityRef = collection(db, 'users', tutorId, 'availability')
    let availabilityQuery = query(availabilityRef)
    
    // Add date filters if provided
    if (startDate) {
      availabilityQuery = query(availabilityQuery, where('startTime', '>=', Timestamp.fromDate(startDate)))
    }
    if (endDate) {
      availabilityQuery = query(availabilityQuery, where('startTime', '<=', Timestamp.fromDate(endDate)))
    }
    
    const snapshot = await getDocs(availabilityQuery)
    
    const slots: AvailabilitySlot[] = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
        recurring: data.recurring ? {
          ...data.recurring,
          endDate: data.recurring.endDate?.toDate()
        } : undefined
      } as AvailabilitySlot
    })
    
    return { success: true, slots }
  } catch (error: any) {
    console.error('Error getting tutor availability:', error)
    return { success: false, error: error.message }
  }
}

// Update availability slot
export async function updateAvailabilitySlot(tutorId: string, slotId: string, updates: Partial<AvailabilitySlot>): Promise<{ success: boolean; error?: string }> {
  try {
    const slotRef = doc(db, 'users', tutorId, 'availability', slotId)
    
    const updateData: any = { ...updates }
    
    // Convert dates to timestamps
    if (updates.startTime) {
      updateData.startTime = Timestamp.fromDate(updates.startTime)
    }
    if (updates.endTime) {
      updateData.endTime = Timestamp.fromDate(updates.endTime)
    }
    if (updates.recurring?.endDate) {
      updateData.recurring = {
        ...updates.recurring,
        endDate: Timestamp.fromDate(updates.recurring.endDate)
      }
    }
    
    await updateDoc(slotRef, updateData)
    
    return { success: true }
  } catch (error: any) {
    console.error('Error updating availability slot:', error)
    return { success: false, error: error.message }
  }
}

// Delete availability slot
export async function deleteAvailabilitySlot(tutorId: string, slotId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const slotRef = doc(db, 'users', tutorId, 'availability', slotId)
    await deleteDoc(slotRef)
    
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting availability slot:', error)
    return { success: false, error: error.message }
  }
}

// Check if tutor profile setup is complete
export async function isTutorProfileComplete(uid: string): Promise<{ complete: boolean; setupStep: number }> {
  try {
    const tutorResult = await getTutorProfile(uid)
    
    if (!tutorResult.success || !tutorResult.tutorProfile) {
      return { complete: false, setupStep: 0 }
    }
    
    const profile = tutorResult.tutorProfile
    
    return {
      complete: profile.profileCompleted || false,
      setupStep: profile.setupStep || 0
    }
  } catch (error) {
    console.error('Error checking tutor profile completion:', error)
    return { complete: false, setupStep: 0 }
  }
}
