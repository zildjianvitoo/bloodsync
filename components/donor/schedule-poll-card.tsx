"use client";

import { useEffect, useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const responseSchema = z.object({
  optionId: z.string().min(1, "Select an option"),
});

type SchedulePollForm = z.infer<typeof responseSchema>;

type PollOption = {
  id: string;
  label: string;
  votes: number;
};

type PollState = {
  id: string;
  question: string;
  totalResponses: number;
  options: PollOption[];
};

type SchedulePollCardProps = {
  eventId: string;
  donorId?: string | null;
};

export function SchedulePollCard({ eventId, donorId }: SchedulePollCardProps) {
  const [poll, setPoll] = useState<PollState | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const form = useForm<SchedulePollForm>({
    resolver: zodResolver(responseSchema) as Resolver<SchedulePollForm>,
    defaultValues: {
      optionId: "",
    },
  });

  useEffect(() => {
    let active = true;

    async function loadPoll() {
      setLoading(true);
      setServerError(null);
      try {
        const response = await fetch(`/api/poll?eventId=${eventId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch poll");
        }
        const data = (await response.json()) as { poll: PollState | null };
        if (!active) return;
        setPoll(data.poll);
        if (data.poll && data.poll.options[0]) {
          form.setValue("optionId", data.poll.options[0].id, { shouldDirty: false });
        }
      } catch (error) {
        console.error(error);
        if (active) {
          setServerError("Unable to load poll right now");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPoll();

    return () => {
      active = false;
    };
  }, [eventId, form]);

  const totalVotes = poll?.totalResponses ?? 0;

  function onSubmit(values: SchedulePollForm) {
    if (!poll) return;
    setServerError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/poll/${poll.id}/respond`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ optionId: values.optionId, donorId }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "Unable to submit" }));
          setServerError(data.error ?? "Unable to submit response");
          return;
        }

        const data = (await response.json()) as { poll: PollState | null };
        if (data.poll) {
          setPoll(data.poll);
        }
      } catch (error) {
        console.error(error);
        setServerError("Unable to submit response right now");
      }
    });
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading future schedule poll…</p>;
  }

  if (!poll) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background/70 px-5 py-4 text-sm text-muted-foreground">
        No schedule poll available yet. Check back after your donation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Next donation planning</p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{poll.question}</h3>
        <p className="text-xs text-muted-foreground">
          {totalVotes} {totalVotes === 1 ? "response" : "responses"} so far.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="optionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Preferred slot</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = poll.totalResponses
                        ? Math.round((option.votes / Math.max(poll.totalResponses, 1)) * 100)
                        : 0;
                      return (
                        <label
                          key={option.id}
                          className="flex cursor-pointer flex-col gap-2 rounded-xl border border-border/70 bg-background/80 px-4 py-3 transition hover:border-primary/60"
                        >
                          <div className="flex items-center gap-3 text-sm">
                            <input
                              type="radio"
                              name="poll-option"
                              value={option.id}
                              checked={field.value === option.id}
                              onChange={(event) => field.onChange(event.target.value)}
                              disabled={pending}
                              className="h-4 w-4 accent-primary"
                            />
                            <span className="font-medium text-foreground">{option.label}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{option.votes} vote{option.votes === 1 ? "" : "s"}</span>
                            <span>{percentage}%</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError ? <p className="text-sm text-destructive">{serverError}</p> : null}

          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Saving…" : "Save preference"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
