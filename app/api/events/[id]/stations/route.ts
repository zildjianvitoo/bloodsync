import { NextResponse } from "next/server";
import { z } from "zod";
import { addStationToEvent } from "@/lib/db/events";
import { emitTelemetry } from "@/lib/telemetry";
import { broadcastEventQueue } from "@/lib/realtime/queue";

const createStationSchema = z.object({
  type: z.enum(["SCREENING", "DONOR"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const json = await request.json();
    const parsed = createStationSchema.parse(json);

    const station = await addStationToEvent(id, { type: parsed.type });

    emitTelemetry({
      name: "station:created",
      actorRole: "organizer",
      context: { eventId: id, stationId: station.id, type: station.type },
    });

    await broadcastEventQueue(id);

    return NextResponse.json({ station }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events/[id]/stations failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add station" }, { status: 500 });
  }
}
