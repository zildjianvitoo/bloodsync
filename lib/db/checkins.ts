import { prisma } from "@/lib/db/prisma";
import { emitTelemetry } from "@/lib/telemetry";
import type { EventQueuePayload } from "@/lib/db/queue";
import { getEventQueue } from "@/lib/db/queue";
import { broadcastEventQueue } from "@/lib/realtime/queue";

const AVERAGE_SCREENING_MINUTES = 12;

type CheckInResult = {
  ticket: {
    appointmentId: string;
    status: string;
    queueNumber: number;
    peopleInFront: number;
    etaMinutes: number;
    station: {
      id: string;
      type: "SCREENING" | "DONOR";
    } | null;
  };
  event: EventQueuePayload["event"];
  stats: EventQueuePayload["stats"];
};

class CheckInError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function chooseLeastLoadedStation(stations: {
  id: string;
  type: string;
  isActive: boolean;
  appointments: { id: string }[];
}[]) {
  if (!stations.length) return null;
  return stations.reduce((lowest, station) => {
    if (!lowest) return station;
    return station.appointments.length < lowest.appointments.length ? station : lowest;
  }, stations[0]!);
}

export async function checkInDonor(eventId: string, donorToken: string): Promise<CheckInResult> {
  const trimmedToken = donorToken.trim();
  if (!trimmedToken) {
    throw new CheckInError("Missing donor token", 400);
  }

  const { appointment: updatedAppointment, assignedStationId } = await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      throw new CheckInError("Event not found", 404);
    }

    const donor = await tx.donor.findUnique({
      where: { phoneHash: trimmedToken },
      select: { id: true },
    });

    if (!donor) {
      throw new CheckInError("Donor not recognized", 404);
    }

    const appointment = await tx.appointment.findFirst({
      where: {
        eventId,
        donorId: donor.id,
        status: {
          in: ["BOOKED", "CHECKED_IN"],
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
      },
    });

    if (!appointment) {
      throw new CheckInError("No active appointment for donor", 404);
    }

    let assignedStationId: string | null = null;

    const shouldAssignStation = ["BOOKED", "CHECKED_IN"].includes(appointment.status);

    if (shouldAssignStation && !appointment.stationId) {
      const screeningStations = await tx.station.findMany({
        where: {
          eventId,
          type: "SCREENING",
          isActive: true,
        },
        include: {
          appointments: {
            where: {
              status: {
                in: ["CHECKED_IN", "SCREENING"],
              },
            },
            select: {
              id: true,
            },
          },
        },
      });

      const selectedStation = chooseLeastLoadedStation(screeningStations);
      assignedStationId = selectedStation?.id ?? null;
    } else if (shouldAssignStation) {
      assignedStationId = appointment.stationId;
    }

    const nextStatus = appointment.status === "BOOKED" ? "CHECKED_IN" : appointment.status;

    const updated = await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: nextStatus,
        stationId: assignedStationId ?? appointment.stationId,
      },
      select: {
        id: true,
        status: true,
        slotTime: true,
        stationId: true,
      },
    });

    await tx.checkin.upsert({
      where: { appointmentId: appointment.id },
      create: {
        appointmentId: appointment.id,
        timestamp: new Date(),
      },
      update: {
        timestamp: new Date(),
      },
    });

    return { appointment: updated, assignedStationId: updated.stationId ?? assignedStationId };
  });

  const queue = await getEventQueue(eventId);
  if (!queue) {
    throw new CheckInError("Failed to load queue after check-in", 500);
  }

  const waitingIndex = queue.waiting.findIndex((entry) => entry.id === updatedAppointment.id);
  const peopleInFront = waitingIndex >= 0 ? waitingIndex : 0;

  const activeScreeningStations = queue.stations.filter((station) => station.type === "SCREENING" && station.isActive).length;
  const etaMinutes = activeScreeningStations > 0
    ? Math.ceil(peopleInFront / activeScreeningStations) * AVERAGE_SCREENING_MINUTES
    : peopleInFront * AVERAGE_SCREENING_MINUTES;

  const queueNumber = waitingIndex >= 0 ? waitingIndex + 1 : 0;

  const stationInfo = assignedStationId
    ? queue.stations.find((station) => station.id === assignedStationId)
    : null;

  emitTelemetry({
    name: "donor:checked_in",
    actorRole: "donor",
    context: {
      eventId,
      appointmentId: updatedAppointment.id,
      stationId: assignedStationId,
      queuePosition: queueNumber,
    },
  });

  await broadcastEventQueue(eventId, queue);

  return {
    ticket: {
      appointmentId: updatedAppointment.id,
      status: updatedAppointment.status,
      queueNumber,
      peopleInFront,
      etaMinutes,
      station: stationInfo ? { id: stationInfo.id, type: stationInfo.type } : null,
    },
    event: queue.event,
    stats: queue.stats,
  };
}

export { CheckInError };
