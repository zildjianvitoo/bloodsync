import { prisma } from "@/lib/db/prisma";
import { broadcastEventQueue } from "@/lib/realtime/queue";
import { emitTelemetry } from "@/lib/telemetry";

export async function advanceAppointmentForStation(stationId: string) {
  const station = await prisma.station.findUnique({
    where: { id: stationId },
    select: {
      id: true,
      type: true,
      eventId: true,
    },
  });

  if (!station) {
    throw new Error("Station not found");
  }

  if (station.type === "SCREENING") {
    const inProgress = await prisma.appointment.findFirst({
      where: {
        eventId: station.eventId,
        stationId: station.id,
        status: "SCREENING",
      },
      orderBy: {
        slotTime: "asc",
      },
    });

    if (inProgress) {
      const updated = await prisma.appointment.update({
        where: { id: inProgress.id },
        data: {
          status: "DONOR",
          stationId: null,
        },
        select: {
          id: true,
          donorId: true,
          status: true,
          slotTime: true,
          donor: {
            select: {
              phoneHash: true,
            },
          },
        },
      });

      return {
        appointment: updated,
        nextStatus: "DONOR",
        previousStatus: "SCREENING",
      };
    }

    const waiting = await prisma.appointment.findFirst({
      where: {
        eventId: station.eventId,
        status: "CHECKED_IN",
        stationId: station.id,
      },
      orderBy: {
        slotTime: "asc",
      },
    }) ??
    await prisma.appointment.findFirst({
      where: {
        eventId: station.eventId,
        status: "CHECKED_IN",
        stationId: null,
      },
      orderBy: {
        slotTime: "asc",
      },
    });

    if (!waiting) {
      return null;
    }

    const updated = await prisma.appointment.update({
      where: { id: waiting.id },
      data: {
        status: "SCREENING",
        stationId: station.id,
      },
      select: {
        id: true,
        donorId: true,
        status: true,
        slotTime: true,
        donor: {
          select: {
            phoneHash: true,
          },
        },
      },
    });

    return {
      appointment: updated,
      nextStatus: "SCREENING",
      previousStatus: "CHECKED_IN",
    };
  }

  const donating = await prisma.appointment.findFirst({
    where: {
      eventId: station.eventId,
      stationId: station.id,
      status: "DONOR",
    },
    orderBy: {
      slotTime: "asc",
    },
  });

  if (donating) {
    const updated = await prisma.appointment.update({
      where: { id: donating.id },
      data: {
        status: "DONE",
        stationId: null,
      },
      select: {
        id: true,
        donorId: true,
        status: true,
        slotTime: true,
        donor: {
          select: {
            phoneHash: true,
          },
        },
      },
    });

    return {
      appointment: updated,
      nextStatus: "DONE",
      previousStatus: "DONOR",
    };
  }

  const readyForDonation = await prisma.appointment.findFirst({
    where: {
      eventId: station.eventId,
      status: "DONOR",
      stationId: null,
    },
    orderBy: {
      slotTime: "asc",
    },
  });

  if (!readyForDonation) {
    return null;
  }

  const updated = await prisma.appointment.update({
    where: { id: readyForDonation.id },
    data: {
      stationId: station.id,
    },
    select: {
      id: true,
      donorId: true,
      status: true,
      slotTime: true,
      donor: {
        select: {
          phoneHash: true,
        },
      },
    },
  });

  return {
    appointment: updated,
    nextStatus: "DONOR",
    previousStatus: "SCREENING",
  };
}

const DEFAULT_NO_SHOW_GRACE_MINUTES = Number(process.env.NO_SHOW_GRACE_MINUTES ?? 15);

type NoShowAppointment = {
  id: string;
  eventId: string;
};

export async function markNoShowAppointments(graceMinutes = DEFAULT_NO_SHOW_GRACE_MINUTES) {
  if (graceMinutes <= 0) {
    return { updated: 0 };
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - graceMinutes * 60_000);

  const overdue = await prisma.appointment.findMany({
    where: {
      OR: [
        {
          status: "BOOKED",
          slotTime: {
            lte: cutoff,
          },
        },
        {
          status: "CHECKED_IN",
          checkin: {
            timestamp: {
              lte: cutoff,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      eventId: true,
    },
  });

  if (overdue.length === 0) {
    return { updated: 0 };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const ids = overdue.map((appointment) => appointment.id);
    await tx.appointment.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: "NO_SHOW",
        stationId: null,
      },
    });
    return ids.length;
  });

  const events = new Map<string, NoShowAppointment[]>();
  overdue.forEach((appointment) => {
    const list = events.get(appointment.eventId) ?? [];
    list.push(appointment);
    events.set(appointment.eventId, list);
  });

  await Promise.all(
    Array.from(events.entries()).map(async ([eventId, appointments]) => {
      emitTelemetry({
        name: "appointment:auto_no_show",
        actorRole: "system",
        context: {
          eventId,
          appointments: appointments.map((item) => item.id),
          graceMinutes,
        },
      });
      await broadcastEventQueue(eventId);
    })
  );

  return { updated };
}
