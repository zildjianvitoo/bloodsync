import { findDueReminders, markReminderSent } from "@/lib/reminders";
import { emitTelemetry } from "@/lib/telemetry";
import { sendEmail } from "@/lib/email";

export async function processDueReminders(limit = 20) {
  const due = await findDueReminders(limit);
  if (due.length === 0) {
    return { processed: 0 };
  }

  for (const reminder of due) {
    if (!reminder.contactEmail) {
      emitTelemetry({
        name: "reminder:skipped",
        actorRole: "system",
        context: {
          reminderId: reminder.id,
          reason: "missing_email",
        },
      });
      continue;
    }
    emitTelemetry({
      name: "reminder:queued",
      actorRole: "system",
      context: {
        reminderId: reminder.id,
        donorId: reminder.donorId,
        eventId: reminder.eventId,
      },
    });
    const subject = reminder.event?.name
      ? `You're almost eligible for ${reminder.event.name}`
      : "You're almost eligible to donate again";
    const body = `Hi ${reminder.donor?.name ?? "donor"},\n\nThanks for donating with us. You're eligible to donate again soon.$
{reminder.event?.name ? ` We'll reach out when ${reminder.event.name} opens.` : ""}\n\nSee you soon!`;
    await sendEmail({
      to: reminder.contactEmail,
      subject,
      body,
    });
    await markReminderSent(reminder.id);
  }

  return { processed: due.length };
}
