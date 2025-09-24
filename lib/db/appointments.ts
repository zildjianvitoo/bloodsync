import { prisma } from "@/lib/db/prisma";

const STATUS_FLOW: Record<string, string> = {
  CHECKED_IN: "SCREENING",
  SCREENING: "DONOR",
  DONOR: "DONE",
};

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

  const statusToAdvance = station.type === "SCREENING" ? "CHECKED_IN" : "SCREENING";
  const nextStatus = STATUS_FLOW[statusToAdvance];

  if (!nextStatus) {
    throw new Error("No next status configured");
  }

  let appointment = await prisma.appointment.findFirst({
    where: {
      eventId: station.eventId,
      status: statusToAdvance,
      stationId: station.id,
    },
    orderBy: {
      slotTime: "asc",
    },
  });

  if (!appointment && (statusToAdvance === "CHECKED_IN" || statusToAdvance === "SCREENING")) {
    appointment = await prisma.appointment.findFirst({
      where: {
        eventId: station.eventId,
        status: statusToAdvance,
        stationId: null,
      },
      orderBy: {
        slotTime: "asc",
      },
    });
  }

  if (!appointment) {
    return null;
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: nextStatus,
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
    nextStatus,
    previousStatus: statusToAdvance,
  };
}
