"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const feedbackSchema = z.object({
  csat: z.coerce.number().int().min(1).max(5),
  nps: z.coerce.number().int().min(0).max(10),
  comment: z
    .string()
    .trim()
    .max(120, "Keep comments to 120 characters")
    .optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

type FeedbackSurveyProps = {
  eventId: string;
  donorId?: string | null;
};

export function FeedbackSurvey({ eventId, donorId }: FeedbackSurveyProps) {
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema) as Resolver<FeedbackFormValues>,
    defaultValues: {
      csat: 5,
      nps: 10,
      comment: "",
    },
  });

  function onSubmit(values: FeedbackFormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventId,
            donorId,
            ...values,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "Unable to submit" }));
          setServerError(data.error ?? "Unable to submit feedback");
          return;
        }

        setSubmitted(true);
      } catch (error) {
        console.error(error);
        setServerError("Unable to submit feedback right now");
      }
    });
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-900">
        <p className="font-semibold">Thanks for the signal!</p>
        <p className="text-emerald-800">Volunteers see live CSAT trends on the operations dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="csat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CSAT (1–5)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      step={1}
                      value={field.value?.toString() ?? ""}
                      onChange={(event) => field.onChange(event.target.value)}
                      disabled={pending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NPS (0–10)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={1}
                      value={field.value?.toString() ?? ""}
                      onChange={(event) => field.onChange(event.target.value)}
                      disabled={pending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optional shout-out</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      maxLength={120}
                      disabled={pending}
                      value={field.value ?? ""}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="What went great? Any suggestions?"
                    />
                  </FormControl>
                  <FormMessage />
              </FormItem>
            )}
          />

          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Sending…" : "Share feedback"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
