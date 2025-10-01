"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const schema = z.object({
  message: z.string().min(1, "Message is required").max(240, "Keep it under 240 characters"),
  level: z.enum(["info", "success", "warning", "error"]),
  eventId: z.string().optional(),
});

type BroadcastFormValues = z.infer<typeof schema>;

type BroadcastFormProps = {
  events: { id: string; name: string }[];
};

export function BroadcastForm({ events }: BroadcastFormProps) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: "",
      level: "info",
      eventId: "",
    },
  });

  function onSubmit(values: BroadcastFormValues) {
    setStatus(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/broadcast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: values.message,
            level: values.level,
            eventId: values.eventId ? values.eventId : null,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "Unable to send broadcast" }));
          setStatus({ type: "error", message: data.error ?? "Unable to send broadcast" });
          return;
        }

        form.reset({ message: "", level: values.level, eventId: values.eventId });
        setStatus({ type: "success", message: "Broadcast sent to all devices." });
      } catch (error) {
        console.error(error);
        setStatus({ type: "error", message: "Network error, please try again." });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Broadcast message</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  placeholder="e.g. Screening bay B taking a 5 minute break"
                  rows={3}
                  maxLength={240}
                  disabled={pending}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity</FormLabel>
                <FormControl>
                  <select
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    disabled={pending}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Alert</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="eventId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target event</FormLabel>
                <FormControl>
                  <select
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value === "" ? undefined : event.target.value)}
                    disabled={pending}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">All events</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {status ? (
          <p
            className={`text-sm ${status.type === "success" ? "text-emerald-600" : "text-destructive"}`}
          >
            {status.message}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Sending…" : "Send broadcast"}
        </Button>
      </form>
    </Form>
  );
}
