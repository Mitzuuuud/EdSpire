// app/api/seed-availability/route.ts
import { NextResponse } from "next/server";
import { seedRandomAvailability } from "@/src/lib/services/availabilityService";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const count = Number(searchParams.get("count") ?? 3);
  const tz = searchParams.get("tz") ?? "Asia/Kuala_Lumpur";

  if (!userId) return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });

  try {
    const created = await seedRandomAvailability(userId, count, tz);
    return NextResponse.json({ ok: true, created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}