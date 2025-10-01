import { prisma } from "@/lib/db/prisma";

export type BroadcastLevel = "info" | "success" | "warning" | "error";

export async function createBroadcastMessage(
  eventId: string | null,
  message: string,
  level: BroadcastLevel,
  actorId?: string | null
) {
  return prisma.broadcast.create({
    data: {
      eventId,
      message,
      level,
      actorId,
    },
    select: {
      id: true,
      eventId: true,
      message: true,
      level: true,
      createdAt: true,
    },
  });
}

export async function listRecentBroadcasts(limit = 10, eventId?: string) {
  return prisma.broadcast.findMany({
    where: eventId ? { OR: [{ eventId }, { eventId: null }] } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      eventId: true,
      message: true,
      level: true,
      createdAt: true,
    },
  });
}
