import { NextResponse } from "next/server";
import { listEvents } from "@/lib/db/events";

export async function GET() {
  try {
    const events = await listEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/events failed", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
