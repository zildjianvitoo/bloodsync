"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeRealtime } from "@/lib/realtime/client";
import type { EventKpis } from "@/lib/kpi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
const formatMinutes = (minutes: number) => `${minutes} min`;
const formatThroughput = (value: number) => `${value.toFixed(1)} bags/hr`;

const METRIC_META: { key: keyof EventKpis; label: string; formatter?: (value: number) => string }[] = [
  { key: "checkInRate", label: "Check-in rate", formatter: formatPercent },
  { key: "attendanceRate", label: "Attendance", formatter: formatPercent },
  { key: "averageWaitMinutes", label: "Avg wait", formatter: formatMinutes },
  { key: "throughputPerHour", label: "Throughput", formatter: formatThroughput },
  { key: "targetProgress", label: "Target progress", formatter: formatPercent },
];

export function KpiDashboard({ eventId, initial }: { eventId: string; initial: EventKpis }) {
  const [kpi, setKpi] = useState<EventKpis>(initial);

  useEffect(() => {
    setKpi(initial);
  }, [initial]);

  useEffect(() => {
    const unsubscribe = subscribeRealtime<EventKpis>(`event:${eventId}:kpi`, (payload) => {
      if (!payload) return;
      setKpi(payload);
    });
    return () => {
      unsubscribe?.();
    };
  }, [eventId]);

  const summary = useMemo(
    () => [
      {
        label: "Waiting",
        value: kpi.waitingCount,
      },
      {
        label: "In screening",
        value: kpi.screeningCount,
      },
      {
        label: "Donating",
        value: kpi.donorCount,
      },
      {
        label: "Done",
        value: kpi.doneCount,
      },
    ],
    [kpi]
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {METRIC_META.map((metric) => (
        <Card key={metric.key} className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {metric.formatter ? metric.formatter(kpi[metric.key]) : kpi[metric.key]}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Updated {new Date(kpi.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </CardContent>
        </Card>
      ))}

      <Card className="md:col-span-2 xl:col-span-3 border-dashed border-border/70 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Flow snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {summary.map((item) => (
            <div key={item.label} className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
          <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total records</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{kpi.totalAppointments}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
