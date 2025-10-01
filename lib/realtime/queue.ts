import { getEventQueue, type EventQueuePayload } from "@/lib/db/queue";
import { getIO } from "@/lib/realtime/server";
import { calculateEventKpis } from "@/lib/kpi";

export async function broadcastEventQueue(eventId: string, queue?: EventQueuePayload) {
  const io = getIO();
  if (!io) return;

  const payload = queue ?? (await getEventQueue(eventId));
  if (!payload) return;

  io.emit(`event:${eventId}:queue`, payload);
  io.emit(`event:${eventId}:kpi`, calculateEventKpis(payload));
}
