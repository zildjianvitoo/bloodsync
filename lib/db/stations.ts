import { prisma } from "@/lib/db/prisma";

export function listStationsWithEvent() {
  return prisma.station.findMany({
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
  });
}
