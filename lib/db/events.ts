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

type CreateEventInput = {
  name: string;
  targetUnits: number;
  startAt: Date;
  endAt?: Date | null;
};

export async function createEventWithStations(
  eventInput: CreateEventInput,
  stations: { type: "SCREENING" | "DONOR"; isActive?: boolean }[]
) {
  return prisma.event.create({
    data: {
      ...eventInput,
      stations: {
        create: stations.map((station) => ({
          type: station.type,
          isActive: station.isActive ?? true,
        })),
      },
    },
    include: {
      stations: true,
    },
  });
}
