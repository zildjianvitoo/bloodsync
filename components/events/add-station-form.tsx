"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { pushInAppNotification } from "@/lib/realtime/in-app";

const schema = z.object({
  type: z.enum(["SCREENING", "DONOR"]),
});

type Values = z.infer<typeof schema>;

export function AddStationForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { type: "SCREENING" },
  });

  function onSubmit(values: Values) {
    startTransition(async () => {
      const response = await fetch(`/api/events/${eventId}/stations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to add station" }));
        pushInAppNotification({
          level: "error",
          title: "Could not add station",
          message: data.error ?? "Please try again",
        });
        return;
      }

      pushInAppNotification({
        level: "success",
        title: "Station added",
        message: `${values.type.toLowerCase()} station ready for volunteers`,
      });
      router.refresh();
      form.reset();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Station type</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="SCREENING">Screening</option>
                  <option value="DONOR">Donor</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add station"}
        </Button>
      </form>
    </Form>
  );
}
