import { NextResponse } from "next/server";
import { z } from "zod";
import { scheduleReminder } from "@/lib/reminders";

const schema = z.object({
  donorId: z.string().min(1, "donorId is required"),
  eventId: z.string().optional(),
  remindInDays: z.coerce.number().int().min(1).max(365).default(90),
  email: z.string().email("Valid email is required"),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = schema.parse(payload);

    const remindOn = new Date(Date.now() + parsed.remindInDays * 24 * 60 * 60 * 1000);
    const reminder = await scheduleReminder({
      donorId: parsed.donorId,
      eventId: parsed.eventId,
      remindOn,
      channel: "email",
      contactEmail: parsed.email,
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    console.error("POST /api/reminders failed", error);
    return NextResponse.json({ error: "Failed to schedule reminder" }, { status: 500 });
  }
}
