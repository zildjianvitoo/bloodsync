"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { pushInAppNotification } from "@/lib/realtime/in-app";

const settingsSchema = z.object({
  name: z.string().min(3, "Name is required"),
  targetUnits: z.number().int().min(1).max(1000),
  startAt: z.string(),
  endAt: z
    .string()
    .optional()
    .nullable(),
});

export type EventSettingsValues = z.infer<typeof settingsSchema>;

export function EventSettingsForm({
  eventId,
  initialValues,
}: {
  eventId: string;
  initialValues: EventSettingsValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<EventSettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialValues,
  });

  function onSubmit(values: EventSettingsValues) {
    startTransition(async () => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          endAt: values.endAt && values.endAt.length > 0 ? values.endAt : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to update event" }));
        form.setError("name", { type: "server", message: data.error ?? "Failed to update event" });
        pushInAppNotification({
          level: "error",
          title: "Update failed",
          message: data.error ?? "Unable to save changes",
        });
        return;
      }

      pushInAppNotification({
        level: "success",
        title: "Event updated",
        message: "Details saved successfully.",
      });
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-lg md:grid-cols-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Event name</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => form.reset(initialValues)} disabled={pending}>
            Reset
          </Button>
        </div>
      </form>
    </Form>
  );
}
