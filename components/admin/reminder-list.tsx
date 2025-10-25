"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export type AdminReminder = {
  id: string;
  remindOn: string;
  status: string;
  donor: {
    id: string;
    name: string;
  };
};

type ReminderListProps = {
  eventId: string;
  initialReminders: AdminReminder[];
};

export function ReminderList({ eventId, initialReminders }: ReminderListProps) {
  const [reminders, setReminders] = useState(initialReminders);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReminders(initialReminders);
  }, [initialReminders]);

  async function refresh() {
    try {
      const response = await fetch(`/api/events/${eventId}/reminders`);
      if (!response.ok) {
        throw new Error("Unable to refresh reminders");
      }
      const data = (await response.json()) as { reminders: AdminReminder[] };
      setReminders(data.reminders);
    } catch (err) {
      console.error(err);
      setError("Failed to refresh reminders");
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {reminders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reminders scheduled yet.</p>
      ) : (
        reminders.map((reminder) => (
          <Card key={reminder.id} className="flex items-center justify-between border-border/60 bg-background/80 p-4 text-sm">
            <div>
              <p className="font-semibold text-foreground">{reminder.donor.name}</p>
              <p className="text-xs text-muted-foreground">
                Remind on {new Date(reminder.remindOn).toLocaleDateString()} · {reminder.status}
              </p>
            </div>
          </Card>
        ))
      )}
      <button onClick={refresh} className="text-xs font-semibold text-primary underline underline-offset-4">
        Refresh
      </button>
    </div>
  );
}
