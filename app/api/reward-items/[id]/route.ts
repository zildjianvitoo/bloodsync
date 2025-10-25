import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { deactivateRewardItem, RewardError, updateRewardItem } from "@/lib/rewards/reward-items";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  cost: z.coerce.number().int().min(1).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  sponsorId: z.string().nullable().optional(),
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
    const parsed = updateSchema.parse(payload);
    const item = await updateRewardItem(id, parsed);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    if (error instanceof RewardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(`PATCH /api/reward-items/${id} failed`, error);
    return NextResponse.json({ error: "Failed to update reward" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deactivateRewardItem(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof RewardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(`DELETE /api/reward-items/${id} failed`, error);
    return NextResponse.json({ error: "Failed to deactivate reward" }, { status: 500 });
  }
}
