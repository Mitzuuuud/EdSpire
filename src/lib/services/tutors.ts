import {
  collection, getDocs, query, where, orderBy, Timestamp, doc, getDoc
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
