import { NextResponse } from "next/server";
import { getSchedulePollForEvent } from "@/lib/db/polls";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const poll = await getSchedulePollForEvent(eventId);
  if (!poll) {
    return NextResponse.json({ poll: null }, { status: 200 });
  }

  return NextResponse.json({
    poll: {
      id: poll.id,
      question: poll.question,
      totalResponses: poll._count.responses,
      options: poll.options.map((option) => ({
        id: option.id,
        label: option.label,
        votes: option._count.responses,
      })),
    },
  });
}
