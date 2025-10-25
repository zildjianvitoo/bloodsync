import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listEventRedemptions } from "@/lib/rewards/reward-items";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "volunteer")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }
  const limitParam = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isNaN(limitParam) ? 20 : limitParam;

  const redemptions = await listEventRedemptions(eventId, limit);
  return NextResponse.json({ redemptions });
}
