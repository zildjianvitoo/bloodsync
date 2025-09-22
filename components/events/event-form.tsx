"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { pushInAppNotification } from "@/lib/realtime/in-app";

const eventSchema = z.object({
  name: z.string().min(3, "Event name is required"),
  targetUnits: z.coerce.number().int().min(1).max(1000),
  startAt: z.string(),
  endAt: z.string().optional().nullable(),
  screeningStations: z.coerce.number().int().min(0).max(10),
  donorStations: z.coerce.number().int().min(0).max(10),
});

export type EventFormValues = z.infer<typeof eventSchema>;

function toLocalDateTimeInput(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

export function EventForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      targetUnits: 120,
      startAt: toLocalDateTimeInput(new Date()),
      endAt: "",
      screeningStations: 2,
      donorStations: 2,
    },
  });

  function onSubmit(values: EventFormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        targetUnits: Number(values.targetUnits),
        screeningStations: Number(values.screeningStations),
        donorStations: Number(values.donorStations),
        endAt: values.endAt ? values.endAt : null,
      };
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to create event" }));
        form.setError("name", { type: "server", message: data.error ?? "Failed to create event" });
        pushInAppNotification({
          level: "error",
          title: "Could not create event",
          message: data.error ?? "Something went wrong. Please try again.",
        });
        return;
      }

      const data = await response.json();
      pushInAppNotification({
        title: "Event created",
        message: "Stations were generated and are ready for volunteers.",
        level: "success",
      });
      router.replace(`/admin/events/${data.event.id}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-foreground">Create blood drive</h1>
        <p className="text-sm text-muted-foreground">
          Configure event basics and initial station layout. Volunteers can adjust in real time.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-6 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-2xl"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sinergi Fest Blood Drive" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetUnits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target units</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={1000} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End time (optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>Leave blank if timing is flexible.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="screeningStations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Screening stations</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={10} {...field} />
                  </FormControl>
                  <FormDescription>Total screening bays at kickoff.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="donorStations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Donor stations</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={10} {...field} />
                  </FormControl>
                  <FormDescription>Bed/chair stations available at start.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create event"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => form.reset()} disabled={pending}>
              Reset form
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
