import { NextResponse } from "next/server";
import { z } from "zod";
import { getIndividualLeaderboard, getTeamLeaderboard } from "@/lib/leaderboard";

const schema = z.object({
  scope: z.enum(["individual", "team"]).default("individual"),
  eventId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = schema.safeParse({
    scope: url.searchParams.get("scope") ?? undefined,
    eventId: url.searchParams.get("eventId") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  const { scope, eventId, limit } = parsed.data;

  if (scope === "team") {
    const data = await getTeamLeaderboard({ eventId, limit });
    return NextResponse.json({ leaderboard: data });
  }

  const data = await getIndividualLeaderboard({ eventId, limit });
  return NextResponse.json({ leaderboard: data });
}
