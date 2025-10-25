import { NextResponse } from "next/server";
import { listEventReminders } from "@/lib/reminders";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reminders = await listEventReminders(id, 10);
  return NextResponse.json({ reminders });
}
