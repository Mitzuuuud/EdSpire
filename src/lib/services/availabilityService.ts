// src/lib/services/availabilityService.ts
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  writeBatch,
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
  nextAvailable?: string; // human-readable soonest start
};

/* --------------------------- small helpers -------------------------- */

const fmtNext = (d: Date) =>
  d.toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

/** Fetch upcoming slots supporting both {start,end} and {startTime,endTime}. */
async function fetchUpcomingSlots(tutorId: string): Promise<AvailSlot[]> {
  const now = new Date();
  const ref = collection(db, "users", tutorId, "availability");

  // Try schema A: end
  let snap = await getDocs(
    query(ref, where("end", ">=", Timestamp.fromDate(now)), orderBy("end", "asc"))
  );

  // If none, try schema B: endTime
  if (snap.empty) {
    snap = await getDocs(
      query(
        ref,
        where("endTime", ">=", Timestamp.fromDate(now)),
        orderBy("endTime", "asc")
      )
    );
  }

  const slots: AvailSlot[] = [];

  for (const d of snap.docs) {
    const data: any = d.data();

    // Normalize to Timestamp fields start/end
    const startTs: Timestamp | null =
      data.start instanceof Timestamp
        ? data.start
        : data.startTime instanceof Timestamp
        ? data.startTime
        : null;

    const endTs: Timestamp | null =
      data.end instanceof Timestamp
        ? data.end
        : data.endTime instanceof Timestamp
        ? data.endTime
        : null;

    if (!startTs || !endTs) continue;

    slots.push({
      id: d.id,
      start: startTs,
      end: endTs,
      tz: data.tz ?? data.timezone ?? "UTC",
      note: data.note,
    });
  }

  return slots;
}

/* ------------------------- profiles & status ------------------------ */

export async function listTutorProfiles(): Promise<TutorProfile[]> {
  const qTutors = query(collection(db, "users"), where("role", "==", "tutor"));
  const snap = await getDocs(qTutors);
  return snap.docs.map((d) => {
    const data: any = d.data();

    // Derive name from email if missing
    let name = data.name ?? data.displayName ?? "Tutor";
    if (!name || name === "Tutor") {
      if (data.email) {
        const localPart = data.email.split("@")[0];
        name = localPart
          .replace(/[\._]/g, " ")
          .split(" ")
          .map(
            (word: string) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .filter((word: string) => word.length > 0)
          .join(" ");
        if (name === "") name = "Tutor";
      }
    }

    // Random subjects if empty
    let subjects = data.tutorProfile?.subjects ?? data.subjects ?? [];
    if (subjects.length === 0) {
      const subjectsList = [
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "Computer Science",
        "English",
        "History",
      ];
      const numSubjects = Math.floor(Math.random() * 3) + 2; // 2-4 subjects
      const selected = new Set<string>();
      while (selected.size < numSubjects) {
        selected.add(subjectsList[Math.floor(Math.random() * subjectsList.length)]);
      }
      subjects = Array.from(selected);
    }

    // Random avatar if missing
    let avatar = data.avatar ?? data.photoURL ?? "/placeholder.svg";
    if (!avatar || avatar === "/placeholder.svg") {
      const avatarList = [
        "/professional-man-computer-science-tutor.png",
        "/professional-woman-biology-tutor.png",
        "/professional-woman-chemistry-tutor.png",
        "/professional-woman-tutor.png",
        "/young-man-math-tutor.png",
        "/professional-man-physics-tutor.png",
      ];
      avatar = avatarList[Math.floor(Math.random() * avatarList.length)];
    }

    // Random specialties if empty
    let specialties = data.tutorProfile?.specialties ?? data.specialties ?? [];
    if (specialties.length === 0) {
      const specialtiesList = [
        "Advanced Calculus",
        "Quantum Mechanics",
        "Organic Chemistry",
        "Data Structures",
        "Creative Writing",
        "Ancient History",
        "Machine Learning",
      ];
      const numSpecialties = Math.floor(Math.random() * 2) + 2; // 2-3 specialties
      const selected = new Set<string>();
      while (selected.size < numSpecialties) {
        selected.add(specialtiesList[Math.floor(Math.random() * specialtiesList.length)]);
      }
      specialties = Array.from(selected);
    }

    return {
      id: d.id,
      name,
      avatar,
      subjects,
      rating: data.rating ?? 4.8,
      reviewCount: data.reviewCount ?? 0,
      hourlyRate: data.hourlyRate ?? 20,
      specialties,
    };
  });
}

export async function getTutorAvailabilityNow(tutorId: string): Promise<{
  availability: "available" | "busy" | "offline";
  nextAvailable?: string;
}> {
  const now = new Date();
  const slots = await fetchUpcomingSlots(tutorId);

  if (slots.length === 0) return { availability: "offline" };

  // If any slot is active now -> available
  if (slots.some((s) => slotActiveNow(s, now))) {
    return { availability: "available" };
  }

  // Otherwise, busy with future slots: show earliest upcoming start
  const soonestStart = slots
    .map((s) => s.start.toDate())
    .filter((d) => d.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return {
    availability: "busy",
    nextAvailable: soonestStart ? fmtNext(soonestStart) : undefined,
  };
}

export async function listTutorsWithStatus(): Promise<TutorWithStatus[]> {
  const tutors = await listTutorProfiles();
  const withStatus = await Promise.all(
    tutors.map(async (t) => {
      const { availability, nextAvailable } = await getTutorAvailabilityNow(t.id);
      return { ...t, availability, nextAvailable };
    })
  );
  return withStatus;
}

/* --------------------- sample availability seeder ------------------- */

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
  existingSlots.docs.forEach((doc) => batch.delete(doc.ref));
  if (existingSlots.docs.length > 0) {
    await batch.commit();
  }

  // For Cimi, Taro, and Koci, ensure they have current availability
  const shouldBeAvailable = tutorName && ["Cimi", "Taro", "Koci"].includes(tutorName);
  if (shouldBeAvailable) {
    const now = new Date();
    const currentEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    const currentSlotData = {
      start: Timestamp.fromDate(now),
      end: Timestamp.fromDate(currentEnd),
      tz,
      note: `Available now for 2h tutoring session`,
      studentLimit: Math.floor(Math.random() * 3) + 1,
      studentIds: [],
    };

    try {
      const docRef = await addDoc(availabilityRef, currentSlotData);
      created.push({
        id: docRef.id,
        ...currentSlotData,
      } as any);
    } catch (error) {
      console.error(`Failed to create current availability slot:`, error);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
      studentIds: [], // No students booked yet
    };

    try {
      const docRef = await addDoc(availabilityRef, slotData);
      created.push({
        id: docRef.id,
        ...slotData,
      } as any);
    } catch (error) {
      console.error(`Failed to create availability slot ${i + 1}:`, error);
    }
  }

  return created;
}
