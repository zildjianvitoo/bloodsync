import { NextResponse } from "next/server";
import { z } from "zod";
import { checkInDonor, CheckInError } from "@/lib/db/checkins";

const checkInSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  donorToken: z.string().min(1, "donorToken is required"),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { eventId, donorToken } = checkInSchema.parse(payload);

    const result = await checkInDonor(eventId, donorToken);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (error instanceof CheckInError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("POST /api/checkin failed", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
