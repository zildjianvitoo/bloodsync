import { findDueReminders, markReminderSent } from "@/lib/reminders";
import { emitTelemetry } from "@/lib/telemetry";

export async function processDueReminders(limit = 20) {
  const due = await findDueReminders(limit);
  if (due.length === 0) {
    return { processed: 0 };
  }

  for (const reminder of due) {
    emitTelemetry({
      name: "reminder:queued",
      actorRole: "system",
      context: {
        reminderId: reminder.id,
        donorId: reminder.donorId,
        eventId: reminder.eventId,
      },
    });
    await markReminderSent(reminder.id);
  }

  return { processed: due.length };
}
