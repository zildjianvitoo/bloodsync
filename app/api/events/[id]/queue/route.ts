import { NextResponse } from "next/server";
import { getEventQueue } from "@/lib/db/queue";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const queue = await getEventQueue(id);
    if (!queue) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(queue, { status: 200 });
  } catch (error) {
    console.error("GET /api/events/[id]/queue failed", error);
    return NextResponse.json({ error: "Failed to load queue" }, { status: 500 });
  }
}
