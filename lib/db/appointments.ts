import { prisma } from "@/lib/db/prisma";

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
