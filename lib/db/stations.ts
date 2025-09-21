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
    },
    orderBy: [{ event: { startAt: "asc" } }, { type: "asc" }],
  });
}
