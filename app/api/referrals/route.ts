import { NextResponse } from "next/server";
import { z } from "zod";
import { createReferral } from "@/lib/referrals";

const schema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  referrerId: z.string().min(1, "referrerId is required"),
  inviteeEmail: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = schema.parse(payload);
    const referral = await createReferral(parsed);
    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    console.error("POST /api/referrals failed", error);
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
