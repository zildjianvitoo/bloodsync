import { NextResponse } from "next/server";
import { z } from "zod";
import { listEvents, createEventWithStations } from "@/lib/db/events";
import { emitTelemetry } from "@/lib/telemetry";

export async function GET() {
  try {
    const events = await listEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/events failed", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

const createEventSchema = z.object({
  name: z.string().min(3, "Name is required"),
  targetUnits: z.coerce.number().int().min(1).max(1000),
  startAt: z.string(),
  endAt: z.string().optional().nullable(),
  screeningStations: z.coerce.number().int().min(0).max(10).default(1),
  donorStations: z.coerce.number().int().min(0).max(10).default(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createEventSchema.parse(body);

    const startAt = new Date(parsed.startAt);
    const endAt = parsed.endAt ? new Date(parsed.endAt) : null;

    if (Number.isNaN(startAt.getTime())) {
      return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
    }

    if (endAt && Number.isNaN(endAt.getTime())) {
      return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
    }

    const stations: { type: "SCREENING" | "DONOR"; isActive?: boolean }[] = [];
    for (let i = 0; i < parsed.screeningStations; i += 1) {
      stations.push({ type: "SCREENING" });
    }
    for (let i = 0; i < parsed.donorStations; i += 1) {
      stations.push({ type: "DONOR" });
    }

    const event = await createEventWithStations(
      {
        name: parsed.name,
        targetUnits: parsed.targetUnits,
        startAt,
        endAt,
      },
      stations
    );

    emitTelemetry({
      name: "event:created",
      actorRole: "organizer",
      context: { eventId: event.id, stations: stations.length },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
