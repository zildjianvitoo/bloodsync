import { NextResponse } from "next/server";
import { getSchedulePollForEvent } from "@/lib/db/polls";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const donorId = searchParams.get("donorId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const pollResult = await getSchedulePollForEvent(eventId, donorId ?? undefined);
  if (!pollResult) {
    return NextResponse.json({ poll: null }, { status: 200 });
  }

  return NextResponse.json({
    poll: {
      id: pollResult.poll.id,
      question: pollResult.poll.question,
      totalResponses: pollResult.poll._count.responses,
      options: pollResult.poll.options.map((option) => ({
        id: option.id,
        label: option.label,
        votes: option._count.responses,
      })),
      respondedOptionId: pollResult.respondedOptionId,
    },
  });
}
