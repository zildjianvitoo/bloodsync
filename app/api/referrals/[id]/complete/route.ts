import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { markReferralCompleted } from "@/lib/referrals";
import { awardPointsOnce, POINT_RULES } from "@/lib/rewards/points";

const schema = z.object({
  referrerId: z.string().min(1, "referrerId is required"),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const payload = await request.json();
    const parsed = schema.parse(payload);
    const referral = await markReferralCompleted(id);

    await awardPointsOnce({
      donorId: parsed.referrerId,
      eventId: referral.eventId,
      source: "REFERRAL",
      value: POINT_RULES.REFERRAL,
      note: "Referral completed",
      awardKey: `referral:${referral.id}`,
    });

    return NextResponse.json({ referral });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    console.error(`PATCH /api/referrals/${id}/complete failed`, error);
    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}
