import { NextResponse } from "next/server";
import { z } from "zod";
import { getIO } from "@/lib/realtime/server";
import { redeemRewardItem, RewardError } from "@/lib/rewards/reward-items";

const redeemSchema = z.object({
  donorId: z.string().min(1, "donorId is required"),
  rewardItemId: z.string().min(1, "rewardItemId is required"),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = redeemSchema.parse(payload);
    const data = await redeemRewardItem(parsed);

    getIO()?.emit("reward:redeemed", {
      donorId: data.redemption.donor?.id,
      donorName: data.redemption.donor?.name,
      rewardItem: data.redemption.rewardItem.name,
      cost: data.redemption.cost,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    if (error instanceof RewardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("POST /api/rewards/redeem failed", error);
    return NextResponse.json({ error: "Failed to redeem reward" }, { status: 500 });
  }
}
