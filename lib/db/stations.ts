import { prisma } from "@/lib/db/prisma";

export async function listStationsWithEvent() {
  const [stations, donorReadyCounts] = await Promise.all([
    prisma.station.findMany({
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startAt: true,
          },
        },
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
      orderBy: [{ event: { startAt: "asc" } }, { type: "asc" }],
    }),
    prisma.appointment.groupBy({
      by: ["eventId"],
      where: {
        status: "DONOR",
        stationId: null,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const donorReadyByEvent = new Map<string, number>();
  for (const row of donorReadyCounts) {
    donorReadyByEvent.set(row.eventId, row._count._all);
  }

  return stations.map((station) => ({
    ...station,
    awaitingDonorCount:
      station.type === "DONOR" ? donorReadyByEvent.get(station.eventId) ?? 0 : 0,
  }));
}
