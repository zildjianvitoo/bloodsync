"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeRealtime } from "@/lib/realtime/client";
import type { EventQueuePayload } from "@/lib/db/queue";

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatEta(minutes: number) {
  if (minutes <= 0) return "Now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }
  return `${hours}h ${remainder}m`;
}

type KioskQueueProps = {
  eventId: string;
  initialQueue: EventQueuePayload;
};

export function KioskQueue({ eventId, initialQueue }: KioskQueueProps) {
  const [queue, setQueue] = useState<EventQueuePayload>(initialQueue);

  useEffect(() => {
    setQueue(initialQueue);
  }, [initialQueue]);

  useEffect(() => {
    const unsubscribe = subscribeRealtime<EventQueuePayload>(`event:${eventId}:queue`, (payload) => {
      setQueue(payload);
    });
    return () => {
      unsubscribe?.();
    };
  }, [eventId]);

  const stationMap = useMemo(() => {
    const map = new Map<string, EventQueuePayload["stations"][number]>();
    queue.stations.forEach((station) => {
      map.set(station.id, station);
    });
    return map;
  }, [queue.stations]);

  const nextFive = queue.waiting.slice(0, 5);
  const activeStations = queue.stations.filter((station) => station.isActive && station.type === "SCREENING").length;
  const averageWaitMinutes = activeStations > 0 ? Math.ceil(queue.stats.waiting / activeStations) * 12 : queue.stats.waiting * 12;

  const targetUnits = queue.event.targetUnits;
  const progressRatio = targetUnits > 0 ? Math.min(queue.stats.done / targetUnits, 1) : 0;
  const progressPercent = Math.round(progressRatio * 100);

  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute left-[-10%] top-[-20%] h-[360px] w-[360px] rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute right-[-5%] top-1/3 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-[140px]" />
        <div className="absolute bottom-[-15%] left-1/3 h-[320px] w-[320px] rounded-full bg-sky-500/20 blur-[140px]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-8 pb-16 pt-16">
        <header className="flex flex-col gap-3 text-slate-100">
          <span className="text-xs uppercase tracking-[0.45em] text-primary/80">Live at {now}</span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{queue.event.name}</h1>
          <p className="text-sm text-slate-300">
            Target {queue.event.targetUnits} bags · Waiting {queue.stats.waiting} · Active screening stations {activeStations}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <Card className="border-none bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-50">Next donors in line</CardTitle>
              <CardDescription className="text-slate-300">
                Volunteers will call donors in this order. We update instantly as stations advance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextFive.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-300">
                  Queue is clear. We&apos;ll notify you as new donors check in.
                </div>
              ) : (
                nextFive.map((entry, index) => {
                  const stationInfo = entry.stationId ? stationMap.get(entry.stationId) : null;
                  const peopleAhead = index;
                  const eta = activeStations > 0 ? Math.ceil(peopleAhead / Math.max(activeStations, 1)) * 12 : peopleAhead * 12;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Ticket</span>
                        <span className="text-lg font-semibold text-slate-50">{entry.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {stationInfo ? (
                          <Badge variant="secondary" className="bg-primary/20 text-primary-foreground">
                            {stationInfo.type === "SCREENING" ? "Screening bay" : "Donation bed"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-white/30 text-slate-200">
                            Assignment pending
                          </Badge>
                        )}
                        <div className="text-right text-sm text-slate-300">
                          <p className="font-medium text-slate-200">ETA {formatEta(eta)}</p>
                          <p>Checked in {formatTime(entry.slotTime)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border-none bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-50">Event pulse</CardTitle>
              <CardDescription className="text-slate-300">
                Instant read on throughput and donor flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Progress to target</span>
                  <span className="font-semibold text-slate-100">{queue.stats.done}/{queue.event.targetUnits} bags ({progressPercent}%)</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-primary shadow-[0_0_30px_theme(colors.primary/60%)]"
                    style={{ width: `${Math.max(progressPercent, 4)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Avg wait</p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">{formatEta(averageWaitMinutes)}</p>
                  <p className="text-xs text-slate-400">Across {queue.stats.waiting} donors in queue</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Stations active</p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">
                    {queue.stations.filter((station) => station.isActive).length}
                  </p>
                  <p className="text-xs text-slate-400">{queue.stations.length} configured</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Screening now</p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">{queue.stats.screening}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Donating now</p>
                  <p className="mt-1 text-xl font-semibold text-slate-50">{queue.stats.donor}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {queue.stations.map((station) => (
            <Card key={station.id} className="border-none bg-white/5 backdrop-blur">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-slate-50">
                    {station.type === "SCREENING" ? "Screening" : "Donation"} Station
                  </CardTitle>
                  <CardDescription className="text-slate-300">#{station.id.slice(0, 6)}</CardDescription>
                </div>
                <Badge
                  variant={station.isActive ? "secondary" : "outline"}
                  className={station.isActive ? "bg-emerald-500/20 text-emerald-100" : "border-white/30 text-slate-300"}
                >
                  {station.isActive ? "Active" : "Paused"}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-slate-200">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Waiting</p>
                    <p className="mt-1 text-lg font-semibold text-slate-50">{station.counts.waiting}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Screening</p>
                    <p className="mt-1 text-lg font-semibold text-slate-50">{station.counts.screening}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Donor</p>
                    <p className="mt-1 text-lg font-semibold text-slate-50">{station.counts.donor}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
