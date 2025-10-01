import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { createBroadcastMessage, listRecentBroadcasts } from "@/lib/db/broadcasts";
import { getIO } from "@/lib/realtime/server";

const broadcastSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(240, "Keep it under 240 characters"),
  level: z.enum(["info", "success", "warning", "error"]).default("info"),
  eventId: z.string().trim().min(1).optional().nullable(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { message, level, eventId } = broadcastSchema.parse(payload);

    const broadcast = await createBroadcastMessage(eventId ?? null, message, level, session.sub);

    getIO()?.emit("broadcast", {
      id: broadcast.id,
      eventId: broadcast.eventId,
      message: broadcast.message,
      level: broadcast.level,
      createdAt: broadcast.createdAt,
    });

    return NextResponse.json({ broadcast }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }

    console.error("POST /api/broadcast failed", error);
    return NextResponse.json({ error: "Failed to send broadcast" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 10);
  const broadcasts = await listRecentBroadcasts(Number.isNaN(limit) ? 10 : limit, eventId);
  return NextResponse.json({ broadcasts });
}
