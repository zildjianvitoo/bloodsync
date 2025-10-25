"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage(null);
    } catch (err) {
      console.error(err);
      setError("Failed to refresh reminders");
    }
  }

  async function cancel(id: string) {
    try {
      const response = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Unable to cancel");
      }
      setReminders((prev) => prev.filter((reminder) => reminder.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to cancel reminder");
    }
  }

  async function sendDue() {
    setMessage(null);
    try {
      const response = await fetch("/api/jobs/reminders/run", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to send reminders");
      }
      const data = await response.json();
      setMessage(`Processed ${data.result.processed} reminders.`);
      await refresh();
    } catch (error) {
      console.error(error);
      setError("Unable to process reminders");
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
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
            <Button size="sm" variant="ghost" onClick={() => cancel(reminder.id)}>
              Cancel
            </Button>
          </Card>
        ))
      )}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={refresh}>
          Refresh
        </Button>
        <Button size="sm" onClick={sendDue}>
          Send due reminders
        </Button>
      </div>
    </div>
  );
}
