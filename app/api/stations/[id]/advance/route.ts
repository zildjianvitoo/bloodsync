import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { advanceAppointmentForStation } from "@/lib/db/appointments";
import { emitTelemetry } from "@/lib/telemetry";
import { getIO } from "@/lib/realtime/server";

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

  getIO()?.emit("notify", {
    title: `${station.event?.name ?? "Event"}`,
    message: `Volunteer advanced donor to ${station.type.toLowerCase()} station`,
    level: "info",
  });

  return NextResponse.json({ appointment, nextStatus });
}
