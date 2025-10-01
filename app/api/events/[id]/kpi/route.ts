import { NextResponse } from "next/server";
import { getEventQueue } from "@/lib/db/queue";
import { calculateEventKpis } from "@/lib/kpi";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const queue = await getEventQueue(id);
  if (!queue) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const kpi = calculateEventKpis(queue);
  return NextResponse.json({ kpi, queueUpdatedAt: queue.event.startAt });
}
