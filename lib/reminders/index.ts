import { prisma } from "@/lib/db/prisma";

export type ReminderStatus = "SCHEDULED" | "SENT" | "CANCELLED";

export type ReminderInput = {
  donorId: string;
  eventId?: string | null;
  remindOn: Date;
  channel?: string | null;
};

export async function scheduleReminder(input: ReminderInput) {
  return prisma.reminder.create({
    data: {
      donorId: input.donorId,
      eventId: input.eventId ?? null,
      remindOn: input.remindOn,
      channel: input.channel ?? null,
    },
  });
}

export async function cancelReminder(id: string) {
  return prisma.reminder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

export async function listDonorReminders(donorId: string) {
  return prisma.reminder.findMany({
    where: { donorId },
    orderBy: { remindOn: "asc" },
  });
}

export async function listEventReminders(eventId: string, limit = 10) {
  return prisma.reminder.findMany({
    where: {
      eventId,
      status: "SCHEDULED",
    },
    orderBy: { remindOn: "asc" },
    take: limit,
    include: {
      donor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
