import {
  collection, getDocs, query, where, orderBy, Timestamp, doc, getDoc, addDoc, writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { slotActiveNow, AvailSlot } from "@/lib/availability";

export type TutorProfile = {
  id: string;
  name?: string;
  avatar?: string;
  subjects?: string[];
  rating?: number;
  reviewCount?: number;
  hourlyRate?: number;
  specialties?: string[];
};

export type TutorWithStatus = TutorProfile & {
  availability: "available" | "busy" | "offline";
  nextAvailable?: string; // human string if you want to show the soonest slot end/start
};

export async function listTutorProfiles(): Promise<TutorProfile[]> {
  const qTutors = query(collection(db, "users"), where("role", "==", "tutor"));
  const snap = await getDocs(qTutors);
  return snap.docs.map(d => {
    const data: any = d.data();
    return {
      id: d.id,
      name: data.name ?? data.displayName ?? "Tutor",
      avatar: data.avatar ?? data.photoURL ?? "/placeholder.svg",
      subjects: data.subjects ?? [],
      rating: data.rating ?? 4.8,
      reviewCount: data.reviewCount ?? 0,
      hourlyRate: data.hourlyRate ?? 20,
      specialties: data.specialties ?? [],
    };
  });
}

export async function getTutorAvailabilityNow(tutorId: string): Promise<{
  availability: "available" | "busy" | "offline";
  nextAvailable?: string;
}> {
  const now = new Date();
  // only need slots that haven't ended
  const slotsRef = collection(db, "users", tutorId, "availability");
  const qSlots = query(slotsRef, where("end", ">=", Timestamp.fromDate(now)), orderBy("end", "asc"));
  const slotsSnap = await getDocs(qSlots);
  const slots: AvailSlot[] = slotsSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  const hasActive = slots.some(s => slotActiveNow(s, now));
  if (hasActive) return { availability: "available" };

  // If not active but has a future slot, mark as "busy" and show the next start
  if (slots.length > 0) {
    const earliest = slots
      .map(s => s.start.toDate())
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const opts: Intl.DateTimeFormatOptions = { weekday: "short", hour: "numeric", minute: "2-digit" };
    return {
      availability: "busy",
      nextAvailable: earliest.toLocaleString(undefined, opts),
    };
  }
  return { availability: "offline" };
}

export async function listTutorsWithStatus(): Promise<TutorWithStatus[]> {
  const tutors = await listTutorProfiles();
  const withStatus = await Promise.all(
    tutors.map(async t => {
      const { availability, nextAvailable } = await getTutorAvailabilityNow(t.id);
      return { ...t, availability, nextAvailable };
    })
  );
  return withStatus;
}

export async function seedRandomAvailability(
  userId: string, 
  count: number = 20, // More slots for 3 weeks
  tz: string = "Asia/Kuala_Lumpur",
  tutorName?: string // Add tutor name to ensure some are available
): Promise<AvailSlot[]> {
  const created: AvailSlot[] = [];
  const availabilityRef = collection(db, "users", userId, "availability");
  
  // Clear existing availability first
  const existingSlots = await getDocs(availabilityRef);
  const batch = writeBatch(db);
  existingSlots.docs.forEach(doc => batch.delete(doc.ref));
  if (existingSlots.docs.length > 0) {
    await batch.commit();
  }
  
  // Generate realistic availability slots over the next 3 weeks (21 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start from beginning of today
  
  // For Cimi, Taro, and Koci, ensure they have current availability
  const shouldBeAvailable = tutorName && ["Cimi", "Taro", "Koci"].includes(tutorName);
  if (shouldBeAvailable) {
    // Add a current availability slot (now until 2 hours from now)
    const now = new Date();
    const currentEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    
    const currentSlotData = {
      start: Timestamp.fromDate(now),
      end: Timestamp.fromDate(currentEnd),
      tz,
      note: `Available now for 2h tutoring session`,
      studentLimit: Math.floor(Math.random() * 3) + 1,
      studentIds: []
    };
    
    try {
      const docRef = await addDoc(availabilityRef, currentSlotData);
      created.push({
        id: docRef.id,
        ...currentSlotData
      });
    } catch (error) {
      console.error(`Failed to create current availability slot:`, error);
    }
  }
  
  const slotsGenerated = new Set<string>(); // Track generated slots to avoid duplicates
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let slotKey = "";
    let startTime: Date = new Date();
    let endTime: Date = new Date();
    let durationHours: number = 1;
    
    // Try to generate a unique slot (avoid conflicts)
    do {
      // Random day in the next 21 days (3 weeks)
      const daysAhead = Math.floor(Math.random() * 21);
      const date = new Date(today);
      date.setDate(date.getDate() + daysAhead);
      
      // Skip weekends occasionally (70% chance to include weekends)
      const dayOfWeek = date.getDay();
      if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() < 0.3) {
        attempts++;
        continue;
      }
      
      // Random hour between 8 AM and 9 PM (extended hours)
      const startHour = 8 + Math.floor(Math.random() * 13); // 8-20 (8 AM - 8 PM)
      const startMinute = [0, 30][Math.floor(Math.random() * 2)]; // 0 or 30 minutes
      
      startTime = new Date(date);
      startTime.setHours(startHour, startMinute, 0, 0);
      
      // Skip past slots
      if (startTime <= new Date()) {
        attempts++;
        continue;
      }
      
      // Duration between 1-4 hours (more variety)
      durationHours = 1 + Math.floor(Math.random() * 3);
      endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + durationHours);
      
      // Don't go past 11 PM
      if (endTime.getHours() >= 23) {
        attempts++;
        continue;
      }
      
      slotKey = `${startTime.toISOString()}-${endTime.toISOString()}`;
      attempts++;
    } while (slotsGenerated.has(slotKey) && attempts < 10);
    
    if (attempts >= 10) continue; // Skip if we can't find a unique slot
    
    slotsGenerated.add(slotKey);
    
    const slotData = {
      start: Timestamp.fromDate(startTime),
      end: Timestamp.fromDate(endTime),
      tz,
      note: `Available for ${durationHours}h tutoring session`,
      studentLimit: Math.floor(Math.random() * 3) + 1, // 1-3 students max
      studentIds: [] // No students booked yet
    };
    
    try {
      const docRef = await addDoc(availabilityRef, slotData);
      created.push({
        id: docRef.id,
        ...slotData
      });
    } catch (error) {
      console.error(`Failed to create availability slot ${i + 1}:`, error);
    }
  }
  
  return created;
}
