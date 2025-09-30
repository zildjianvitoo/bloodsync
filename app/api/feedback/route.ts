import { NextResponse } from "next/server";
import { z } from "zod";
import { createFeedback } from "@/lib/db/feedback";
import { emitTelemetry } from "@/lib/telemetry";

const feedbackSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  donorId: z.string().min(1).optional(),
  csat: z.coerce.number().int().min(1).max(5),
  nps: z.coerce.number().int().min(0).max(10),
  comment: z
    .string()
    .trim()
    .max(120, "Comment must be 120 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = feedbackSchema.parse(payload);

    const feedback = await createFeedback(parsed);

    emitTelemetry({
      name: "donor:feedback_submitted",
      actorRole: "donor",
      context: {
        eventId: feedback.eventId,
        csat: feedback.csat,
        nps: feedback.nps,
      },
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Invalid feedback";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("POST /api/feedback failed", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
