import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { cancelRedemption, fulfillRedemption, RewardError } from "@/lib/rewards/reward-items";

const updateSchema = z.object({
  status: z.enum(["FULFILLED", "CANCELLED"]),
  fulfilledBy: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "volunteer")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const payload = await request.json();
    const parsed = updateSchema.parse(payload);

    const redemption =
      parsed.status === "FULFILLED"
        ? await fulfillRedemption(id, parsed.fulfilledBy ?? session.sub)
        : await cancelRedemption(id);

    return NextResponse.json({ redemption });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    if (error instanceof RewardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(`PATCH /api/redemptions/${id} failed`, error);
    return NextResponse.json({ error: "Failed to update redemption" }, { status: 500 });
  }
}
