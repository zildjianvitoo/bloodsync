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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { pushInAppNotification } from "@/lib/realtime/in-app";
import { formatLocalDateTimeInput } from "@/lib/utils";

const eventSchema = z.object({
  name: z.string().min(3, "Event name is required"),
  targetUnits: z.number().int().min(1).max(1000),
  startAt: z.string(),
  endAt: z
    .string()
    .optional()
    .nullable(),
  screeningStations: z.number().int().min(0).max(10),
  donorStations: z.number().int().min(0).max(10),
});

export type EventFormValues = z.infer<typeof eventSchema>;

export function EventForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      targetUnits: 120,
      startAt: formatLocalDateTimeInput(new Date()),
      endAt: "",
      screeningStations: 2,
      donorStations: 2,
    },
  });

  function onSubmit(values: EventFormValues) {
    startTransition(async () => {
      const payload = {
        ...values,
        endAt: values.endAt && values.endAt.length > 0 ? values.endAt : null,
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
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === "" ? undefined : Number(value));
                      }}
                    />
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
                    <DateTimePicker
                      value={field.value}
                      onChange={(next) => field.onChange(next ?? "")}
                      onBlur={field.onBlur}
                      disabled={pending}
                    />
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
                    <DateTimePicker
                      value={field.value}
                      onChange={(next) => field.onChange(next ?? null)}
                      onBlur={field.onBlur}
                      disabled={pending}
                      placeholder="Select end"
                    />
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
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === "" ? undefined : Number(value));
                      }}
                    />
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
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === "" ? undefined : Number(value));
                      }}
                    />
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
