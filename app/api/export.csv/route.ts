import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { buildCsv } from "@/lib/csv";

const schema = z.object({
  type: z.enum(["checkins", "attendance", "feedback"]),
  eventId: z.string().optional(),
});

function respondWithCsv(filename: string, csv: string) {
  const content = `\uFEFF${csv}`;
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

async function buildCheckinsCsv(eventId?: string) {
  const checkins = await prisma.checkin.findMany({
    where: eventId ? { appointment: { eventId } } : {},
    include: {
      appointment: {
        include: {
          event: { select: { id: true, name: true } },
          donor: { select: { id: true, name: true, phoneHash: true } },
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  const rows = checkins.map((record) => ({
    event_id: record.appointment.event.id,
    event_name: record.appointment.event.name,
    appointment_id: record.appointmentId,
    donor_id: record.appointment.donor.id,
    donor_name: record.appointment.donor.name,
    donor_token: record.appointment.donor.phoneHash,
    status: record.appointment.status,
    slot_time: record.appointment.slotTime.toISOString(),
    checked_in_at: record.timestamp.toISOString(),
  }));

  return respondWithCsv(
    `checkins${eventId ? `_${eventId}` : ""}.csv`,
    buildCsv(rows, [
      "event_id",
      "event_name",
      "appointment_id",
      "donor_id",
      "donor_name",
      "donor_token",
      "status",
      "slot_time",
      "checked_in_at",
    ])
  );
}

async function buildAttendanceCsv(eventId?: string) {
  const appointments = await prisma.appointment.findMany({
    where: eventId ? { eventId } : {},
    include: {
      event: { select: { id: true, name: true } },
      donor: { select: { id: true, name: true, phoneHash: true } },
      checkin: true,
    },
    orderBy: {
      slotTime: "asc",
    },
  });

  const rows = appointments.map((appointment) => ({
    event_id: appointment.event.id,
    event_name: appointment.event.name,
    appointment_id: appointment.id,
    donor_id: appointment.donor.id,
    donor_name: appointment.donor.name,
    donor_token: appointment.donor.phoneHash,
    status: appointment.status,
    slot_time: appointment.slotTime.toISOString(),
    checked_in_at: appointment.checkin?.timestamp?.toISOString() ?? "",
    last_updated_at: appointment.updatedAt.toISOString(),
  }));

  return respondWithCsv(
    `attendance${eventId ? `_${eventId}` : ""}.csv`,
    buildCsv(rows, [
      "event_id",
      "event_name",
      "appointment_id",
      "donor_id",
      "donor_name",
      "donor_token",
      "status",
      "slot_time",
      "checked_in_at",
      "last_updated_at",
    ])
  );
}

async function buildFeedbackCsv(eventId?: string) {
  const feedback = await prisma.feedback.findMany({
    where: eventId ? { eventId } : {},
    include: {
      event: { select: { id: true, name: true } },
      donor: { select: { id: true, name: true, phoneHash: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const rows = feedback.map((item) => ({
    event_id: item.event.id,
    event_name: item.event.name,
    donor_id: item.donor?.id ?? "",
    donor_name: item.donor?.name ?? "",
    donor_token: item.donor?.phoneHash ?? "",
    csat: item.csat,
    nps: item.nps,
    comment: item.comment ?? "",
    created_at: item.createdAt.toISOString(),
  }));

  return respondWithCsv(
    `feedback${eventId ? `_${eventId}` : ""}.csv`,
    buildCsv(rows, [
      "event_id",
      "event_name",
      "donor_id",
      "donor_name",
      "donor_token",
      "csat",
      "nps",
      "comment",
      "created_at",
    ])
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = schema.safeParse({
    type: url.searchParams.get("type"),
    eventId: url.searchParams.get("eventId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { type, eventId } = parsed.data;

  switch (type) {
    case "checkins":
      return buildCheckinsCsv(eventId);
    case "attendance":
      return buildAttendanceCsv(eventId);
    case "feedback":
      return buildFeedbackCsv(eventId);
    default:
      return NextResponse.json({ error: "Unsupported export" }, { status: 400 });
  }
}
