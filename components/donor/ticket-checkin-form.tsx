"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QrScanner } from "@/components/donor/qr-scanner";

const formSchema = z.object({
  eventId: z.string().min(1, "Select an event"),
  donorToken: z.string().min(4, "Enter the token from your QR code"),
});

type TicketFormValues = z.infer<typeof formSchema>;

type TicketPayload = {
  ticket: {
    appointmentId: string;
    status: string;
    queueNumber: number;
    peopleInFront: number;
    etaMinutes: number;
    station: {
      id: string;
      type: "SCREENING" | "DONOR";
    } | null;
  };
  event: {
    id: string;
    name: string;
    startAt: string;
    endAt: string | null;
    targetUnits: number;
  };
  stats: {
    waiting: number;
    screening: number;
    donor: number;
    done: number;
  };
};

type EventOption = {
  id: string;
  name: string;
  startAt: string;
};

export function TicketCheckInForm({
  events,
  initialToken,
  initialEventId,
}: {
  events: EventOption[];
  initialToken?: string;
  initialEventId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<TicketPayload | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventId: initialEventId && events.some((event) => event.id === initialEventId)
        ? initialEventId
        : events[0]?.id ?? "",
      donorToken: initialToken ?? "",
    },
  });

  useEffect(() => {
    if (initialToken) {
      form.setValue("donorToken", initialToken, { shouldDirty: false });
    }
  }, [form, initialToken]);

  useEffect(() => {
    if (initialEventId && events.some((event) => event.id === initialEventId)) {
      form.setValue("eventId", initialEventId, { shouldDirty: false });
    }
  }, [events, form, initialEventId]);

  const selectedEvent = useMemo(() => {
    const currentId = form.watch("eventId");
    return events.find((event) => event.id === currentId);
  }, [events, form]);

  function onSubmit(values: TicketFormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/checkin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "Check-in failed" }));
          setServerError(data.error ?? "Check-in failed");
          setResult(null);
          if (data.error) {
            form.setError("donorToken", { type: "server", message: data.error });
          }
          return;
        }

        const data = (await response.json()) as TicketPayload;
        setResult(data);
      } catch (error) {
        console.error(error);
        setServerError("Unable to reach check-in service. Please try again.");
      }
    });
  }

  return (
    <div className="grid gap-8 md:grid-cols-[420px_minmax(0,1fr)]">
      <Card className="border-border/70 bg-card/90 shadow-xl">
        <CardHeader>
          <CardTitle>Check in with your token</CardTitle>
          <CardDescription>
            Enter the code from your confirmation SMS or QR badge to join the live queue instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        disabled={pending || events.length === 0}
                        className={cn(
                          "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        )}
                      >
                        <option value="" disabled>
                          Select event
                        </option>
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

              <FormField
                control={form.control}
                name="donorToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donor token</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          {...field}
                          placeholder="e.g. hash:alice"
                          autoComplete="off"
                          disabled={pending}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={pending}
                          onClick={() => {
                            setScannerError(null);
                            setScannerOpen((prev) => !prev);
                          }}
                        >
                          {scannerOpen ? "Close" : "Scan QR"}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>Case-sensitive. Shared via your booking confirmation or QR badge.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {scannerOpen ? (
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Scan your QR token
                  </p>
                  <QrScanner
                    onScan={(text) => {
                      form.setValue("donorToken", text, { shouldDirty: true });
                      setScannerOpen(false);
                      setScannerError(null);
                    }}
                    onClose={() => setScannerOpen(false)}
                    onError={(message) => setScannerError(message)}
                  />
                  {scannerError ? (
                    <p className="mt-2 text-xs text-destructive">
                      {scannerError}. You can still type the code manually above.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Allow camera access when prompted. We only read the QR token locally in your browser.
                    </p>
                  )}
                </div>
              ) : null}

              {serverError ? <p className="text-sm font-medium text-destructive">{serverError}</p> : null}

              <Button type="submit" disabled={pending || events.length === 0} className="w-full">
                {pending ? "Checking in…" : "Check in"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/80 shadow-xl">
        <CardHeader>
          <CardTitle>Your ticket</CardTitle>
          <CardDescription>
            See your queue position, estimated wait, and assigned station once check-in succeeds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {result ? (
            <TicketDetails payload={result} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No ticket yet. Submit your donor token to view your live status for
              {selectedEvent ? ` ${selectedEvent.name}.` : " the selected blood drive."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type TicketDetailsProps = {
  payload: TicketPayload;
};

function TicketDetails({ payload }: TicketDetailsProps) {
  const etaText = payload.ticket.etaMinutes <= 0 ? "Ready now" : `${payload.ticket.etaMinutes} min`;
  const eventStart = new Date(payload.event.startAt);
  const eventWindow = format(eventStart, "MMM d • hh:mm a");
  
  const waitSummary = payload.ticket.peopleInFront === 0
    ? "You're next in line"
    : `${payload.ticket.peopleInFront} donor${payload.ticket.peopleInFront === 1 ? "" : "s"} ahead of you`;

  const stationLabel = payload.ticket.station
    ? payload.ticket.station.type === "SCREENING"
      ? "Screening bay"
      : "Donation bed"
    : "Assignment pending";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 px-6 py-5 text-sm">
        <p className="text-xs uppercase tracking-wide text-primary/70">Queue position</p>
        <p className="mt-2 text-3xl font-semibold text-primary">#{payload.ticket.queueNumber}</p>
        <p className="mt-1 text-sm text-primary/80">{waitSummary}</p>
      </div>

      <dl className="grid gap-4 text-sm">
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Estimated wait</dt>
            <dd className="text-base font-semibold text-foreground">{etaText}</dd>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(), { addSuffix: true })}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Station</dt>
          <dd className="text-base font-semibold text-foreground">{stationLabel}</dd>
          {payload.ticket.station ? (
            <p className="text-xs text-muted-foreground">Station ID: {payload.ticket.station.id.slice(0, 8)}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Event window</dt>
          <dd className="text-base font-semibold text-foreground">{eventWindow}</dd>
          <p className="text-xs text-muted-foreground">
            Targeting {payload.event.targetUnits} completed bags today. Currently {payload.stats.done} collected.
          </p>
        </div>
      </dl>

      <div className="space-y-3 rounded-xl border border-border/60 bg-background/70 px-4 py-4 text-xs text-muted-foreground">
        <p>
          Save this page. We'll refresh automatically when volunteers advance the queue. If you close it, you can
          return anytime with your token to see real-time updates.
        </p>
        <Link
          href={`/kiosk/${payload.event.id}`}
          className="inline-flex w-full items-center justify-center rounded-md border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
        >
          View live kiosk for this event
        </Link>
      </div>
    </div>
  );
}
