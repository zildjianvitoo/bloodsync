import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { createRewardItem, listRewardItems, RewardError } from "@/lib/rewards/reward-items";

const createSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
  name: z.string().min(2, "Name is required"),
  cost: z.coerce.number().int().min(1),
  stock: z.coerce.number().int().min(0),
  sponsorId: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") ?? undefined;
  const includeInactive = searchParams.get("includeInactive") === "true";
  const items = await listRewardItems(eventId, includeInactive);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = createSchema.parse(payload);
    const item = await createRewardItem(parsed);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    if (error instanceof RewardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("POST /api/reward-items failed", error);
    return NextResponse.json({ error: "Failed to create reward item" }, { status: 500 });
  }
}
