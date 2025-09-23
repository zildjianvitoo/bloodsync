import { NextResponse } from "next/server";
import { z } from "zod";
import { updateEventBasics } from "@/lib/db/events";
import { emitTelemetry } from "@/lib/telemetry";

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  targetUnits: z.coerce.number().int().min(1).max(1000).optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const json = await request.json();
    const parsed = updateSchema.parse(json);

    const updateData: Record<string, unknown> = {};
    if (parsed.name) updateData.name = parsed.name;
    if (parsed.targetUnits !== undefined) updateData.targetUnits = parsed.targetUnits;
    if (parsed.startAt) {
      const startAt = new Date(parsed.startAt);
      if (Number.isNaN(startAt.getTime())) {
        return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
      }
      updateData.startAt = startAt;
    }
    if (parsed.endAt !== undefined) {
      if (parsed.endAt === null || parsed.endAt === "") {
        updateData.endAt = null;
      } else {
        const endAt = new Date(parsed.endAt);
        if (Number.isNaN(endAt.getTime())) {
          return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
        }
        updateData.endAt = endAt;
      }
    }

    const updated = await updateEventBasics(id, updateData);

    emitTelemetry({
      name: "event:updated",
      actorRole: "organizer",
      context: { eventId: updated.id },
    });

    return NextResponse.json({ event: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/events/[id] failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
