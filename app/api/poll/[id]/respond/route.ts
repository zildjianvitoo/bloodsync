import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPollResponse, getPollSummary, PollResponseError } from "@/lib/db/polls";
import { emitTelemetry } from "@/lib/telemetry";

const respondSchema = z.object({
  optionId: z.string().min(1, "Option is required"),
  donorId: z.string().min(1).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const payload = await request.json();
    const parsed = respondSchema.parse(payload);

    await recordPollResponse(id, parsed.optionId, parsed.donorId);
    const summary = await getPollSummary(id);

    emitTelemetry({
      name: "donor:schedule_poll_responded",
      actorRole: "donor",
      context: {
        pollId: id,
        optionId: parsed.optionId,
        donorId: parsed.donorId,
      },
    });

    return NextResponse.json({ poll: summary }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Invalid response";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (error instanceof PollResponseError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(`POST /api/poll/${id}/respond failed`, error);
    return NextResponse.json({ error: "Failed to record poll response" }, { status: 500 });
  }
}
