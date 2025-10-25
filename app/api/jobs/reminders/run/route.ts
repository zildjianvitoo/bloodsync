import { NextResponse } from "next/server";
import { processDueReminders } from "@/lib/jobs/send-reminders";

export async function POST() {
  const result = await processDueReminders();
  return NextResponse.json({ result });
}
