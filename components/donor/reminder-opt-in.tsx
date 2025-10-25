"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const options = [
  { label: "In 60 days", days: 60 },
  { label: "In 90 days", days: 90 },
  { label: "In 120 days", days: 120 },
];

type ReminderOptInProps = {
  donorId: string;
  eventId?: string;
};

export function ReminderOptIn({ donorId, eventId }: ReminderOptInProps) {
  const [selected, setSelected] = useState(options[1]?.days ?? 90);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ donorId, eventId, remindInDays: selected }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to schedule reminder" }));
        setStatus(data.error ?? "Unable to save reminder");
        return;
      }
      setStatus("We'll ping you when it's time!");
    } catch (error) {
      console.error(error);
      setStatus("Unable to schedule reminder right now");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Next-donation reminder</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.days}
            type="button"
            variant={selected === option.days ? "default" : "outline"}
            size="sm"
            disabled={pending}
            onClick={() => setSelected(option.days)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <Button type="button" size="sm" onClick={submit} disabled={pending}>
        {pending ? "Saving…" : "Save reminder"}
      </Button>
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </div>
  );
}
