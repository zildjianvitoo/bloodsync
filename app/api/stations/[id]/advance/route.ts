import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { advanceAppointmentForStation } from "@/lib/db/appointments";
import { emitTelemetry } from "@/lib/telemetry";
import { getIO } from "@/lib/realtime/server";
import { broadcastEventQueue } from "@/lib/realtime/queue";
import { awardPointsOnce, POINT_RULES } from "@/lib/rewards/points";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const station = await prisma.station.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      eventId: true,
      event: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!station) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  const result = await advanceAppointmentForStation(station.id);

  if (!result) {
    return NextResponse.json({ message: "No donors waiting" }, { status: 200 });
  }

  const { appointment, nextStatus, previousStatus } = result;

  if (nextStatus === "DONE" && appointment.donorId) {
    try {
      await awardPointsOnce({
        donorId: appointment.donorId,
        eventId: station.eventId,
        source: "COMPLETE",
        value: POINT_RULES.COMPLETE,
        note: "Donation completed",
        awardKey: `complete:${station.eventId}:${appointment.donorId}`,
      });
    } catch (error) {
      console.error("Failed to award completion points", error);
    }
  }

  emitTelemetry({
    name: "appointment:advanced",
    actorRole: "volunteer",
    context: {
      stationId: station.id,
      appointmentId: appointment.id,
      from: previousStatus,
      to: nextStatus,
    },
  });

  getIO()?.emit("appointment:advanced", {
    stationId: station.id,
    appointmentId: appointment.id,
    status: nextStatus,
    slotTime: appointment.slotTime,
  });

  if (appointment.donor?.phoneHash) {
    getIO()?.emit("donor:turn_called", {
      donorToken: appointment.donor.phoneHash,
      eventId: station.eventId,
      eventName: station.event?.name ?? "Event",
      stationId: station.id,
      stationType: station.type,
      appointmentId: appointment.id,
    });
  }

  getIO()?.emit("notify", {
    title: `${station.event?.name ?? "Event"}`,
    message: `Volunteer advanced donor to ${station.type.toLowerCase()} station`,
    level: "info",
  });

  await broadcastEventQueue(station.eventId);

  return NextResponse.json({ appointment, nextStatus });
}
