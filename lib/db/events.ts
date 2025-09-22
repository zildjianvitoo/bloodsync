import { prisma } from "@/lib/db/prisma";

export async function listEvents() {
  return prisma.event.findMany({
    orderBy: { startAt: "asc" },
  });
}

export async function getEventById(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      stations: {
        include: {
          appointments: {
            where: {
              status: {
                in: ["CHECKED_IN", "SCREENING", "DONOR"],
              },
            },
            select: {
              id: true,
              status: true,
              slotTime: true,
            },
            orderBy: {
              slotTime: "asc",
            },
          },
        },
      },
    },
  });
}
