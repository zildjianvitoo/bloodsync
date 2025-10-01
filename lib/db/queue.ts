import { prisma } from "@/lib/db/prisma";

export type QueueAppointment = {
  id: string;
  status: string;
  slotTime: string;
  stationId: string | null;
  checkinAt: string | null;
};

export type StationQueueInfo = {
  id: string;
  type: "SCREENING" | "DONOR";
  isActive: boolean;
  counts: {
    waiting: number;
    screening: number;
    donor: number;
  };
};

export type EventQueuePayload = {
  event: {
    id: string;
    name: string;
    startAt: string;
    endAt: string | null;
    targetUnits: number;
  };
  waiting: QueueAppointment[];
  screening: QueueAppointment[];
  donor: QueueAppointment[];
  done: QueueAppointment[];
  stations: StationQueueInfo[];
  stats: {
    waiting: number;
    screening: number;
    donor: number;
    done: number;
  };
  statusCounts: Record<string, number>;
};

export async function getEventQueue(eventId: string): Promise<EventQueuePayload | null> {
  const event = await prisma.event.findUnique({
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
            orderBy: {
              slotTime: "asc",
            },
            select: {
              id: true,
              status: true,
              slotTime: true,
              checkin: {
                select: {
                  timestamp: true,
                },
              },
            },
          },
        },
      },
      appointments: {
        where: {
          status: {
            in: ["CHECKED_IN", "SCREENING", "DONOR", "DONE"],
          },
        },
        orderBy: {
          slotTime: "asc",
        },
        select: {
          id: true,
          status: true,
          slotTime: true,
          stationId: true,
          checkin: {
            select: {
              timestamp: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    return null;
  }

  const grouped = await prisma.appointment.groupBy({
    by: ["status"],
    where: {
      eventId,
    },
    _count: {
      _all: true,
    },
  });

  const statusCounts = grouped.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = item._count._all;
    return acc;
  }, {});

  const waiting: QueueAppointment[] = [];
  const screening: QueueAppointment[] = [];
  const donor: QueueAppointment[] = [];
  const done: QueueAppointment[] = [];

  for (const appointment of event.appointments) {
    const payload: QueueAppointment = {
      id: appointment.id,
      status: appointment.status,
      slotTime: appointment.slotTime.toISOString(),
      stationId: appointment.stationId,
      checkinAt: appointment.checkin?.timestamp
        ? appointment.checkin.timestamp.toISOString()
        : null,
    };
    switch (appointment.status) {
      case "CHECKED_IN":
        waiting.push(payload);
        break;
      case "SCREENING":
        screening.push(payload);
        break;
      case "DONOR":
        donor.push(payload);
        break;
      case "DONE":
        done.push(payload);
        break;
      default:
        break;
    }
  }

  const stations: StationQueueInfo[] = event.stations.map((station) => {
    const counts = station.appointments.reduce(
      (acc, appointment) => {
        if (appointment.status === "CHECKED_IN") acc.waiting += 1;
        if (appointment.status === "SCREENING") acc.screening += 1;
        if (appointment.status === "DONOR") acc.donor += 1;
        return acc;
      },
      { waiting: 0, screening: 0, donor: 0 }
    );

    return {
      id: station.id,
      type: station.type as "SCREENING" | "DONOR",
      isActive: station.isActive,
      counts,
    };
  });

  return {
    event: {
      id: event.id,
      name: event.name,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt ? event.endAt.toISOString() : null,
      targetUnits: event.targetUnits,
    },
    waiting,
    screening,
    donor,
    done,
    stations,
    stats: {
      waiting: waiting.length,
      screening: screening.length,
      donor: donor.length,
      done: done.length,
    },
    statusCounts,
  };
}
