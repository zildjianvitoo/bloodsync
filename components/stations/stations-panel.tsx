"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { pushInAppNotification } from "@/lib/realtime/in-app";

export type StationResource = {
  id: string;
  type: string;
  isActive: boolean;
  appointments: {
    id: string;
    status: string;
    slotTime: Date;
  }[];
};

const statusLabels: Record<string, string> = {
  CHECKED_IN: "Waiting",
  SCREENING: "Screening",
  DONOR: "Donor",
};

export function StationsPanel({ stations }: { stations: StationResource[] }) {
  const router = useRouter();
  const [pendingStation, setPendingStation] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localStations, setLocalStations] = useState(stations);
  const [advanceState, setAdvanceState] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalStations(stations);
  }, [stations]);

  async function toggleStation(stationId: string, isActive: boolean) {
    const previous = localStations;
    setPendingStation(stationId);
    setLocalStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, isActive } : s))
    );

    try {
      const response = await fetch(`/api/stations/${stationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update station");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setLocalStations(previous);
    } finally {
      setPendingStation(null);
    }
  }

  async function advanceQueue(stationId: string) {
    setPendingStation(stationId);
    try {
      const response = await fetch(`/api/stations/${stationId}/advance`, {
        method: "POST",
      });

      if (!response.ok) {
        console.warn("advance failed", await response.json().catch(() => ({})));
      }

      startTransition(() => {
        router.refresh();
      });

      pushInAppNotification({
        title: "Next donor called",
        message: "Queue advanced successfully",
        level: "success",
      });
      setAdvanceState((prev) => ({ ...prev, [stationId]: new Date().toISOString() }));
      setTimeout(() => {
        setAdvanceState((prev) => {
          const next = { ...prev };
          delete next[stationId];
          return next;
        });
      }, 2500);
    } catch (error) {
      console.error(error);
    } finally {
      setPendingStation(null);
    }
  }

  return (
    <CardContent className="space-y-5 p-6">
      {localStations.map((station) => {
        const counts = station.appointments.reduce<Record<string, number>>((acc, appointment) => {
          acc[appointment.status] = (acc[appointment.status] ?? 0) + 1;
          return acc;
        }, {});
        const isAdvancing = isPending && pendingStation === station.id;
        const lastAdvanceToken = advanceState[station.id];
        const waitingDonor = station.appointments.find((appointment) => appointment.status === "CHECKED_IN");

        return (
          <div
            key={station.id}
            className="flex flex-col gap-5 rounded-2xl border border-border bg-background/80 p-6 transition-shadow hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Station</p>
                  <h3 className="text-lg font-semibold capitalize text-foreground">
                    {station.type.toLowerCase()}
                  </h3>
                  <p className="text-xs text-muted-foreground">#{station.id.slice(0, 6)}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <span
                      key={status}
                      className="rounded-full bg-muted px-3 py-1 text-muted-foreground"
                    >
                      {label}: {counts[status] ?? 0}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 self-start">
                <Badge variant={station.isActive ? "success" : "outline"}>
                  {station.isActive ? "Active" : "Paused"}
                </Badge>
                {lastAdvanceToken ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Donor advanced
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Up next
                </p>
                {waitingDonor ? (
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <p className="text-foreground">
                      Donor ticket <span className="font-semibold">{waitingDonor.id.slice(0, 6)}</span>
                    </p>
                    <p>Arrived {new Date(waitingDonor.slotTime).toLocaleTimeString()}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No waiting donors. Keep an eye on the check-in queue.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                <Button
                  size="sm"
                  className="w-full md:w-40"
                  disabled={isAdvancing || !waitingDonor}
                  onClick={() => advanceQueue(station.id)}
                >
                  {isAdvancing ? "Calling…" : waitingDonor ? "Call next donor" : "No donors waiting"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full md:w-40"
                  disabled={isPending && pendingStation === station.id}
                  onClick={() => toggleStation(station.id, !station.isActive)}
                >
                  {station.isActive ? "Pause station" : "Resume station"}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Volunteers down the line see this instantly.
                </p>
              </div>
            </div>
          </div>
        );
      })}
      {localStations.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No stations configured yet.
        </div>
      ) : null}
    </CardContent>
  );
}
