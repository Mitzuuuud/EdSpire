import { Timestamp } from "firebase/firestore";

export type AvailSlot = {
  id: string;
  start: Timestamp;
  end: Timestamp;
  tz: string;
  note?: string;
};

export function slotActiveNow(slot: AvailSlot, now = new Date()) {
  const s = slot.start.toDate().getTime();
  const e = slot.end.toDate().getTime();
  const n = now.getTime();
  return n >= s && n <= e;
}
