"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

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
  const [recentlyAdvanced, setRecentlyAdvanced] = useState<Record<string, boolean>>({});

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

      setRecentlyAdvanced((prev) => ({ ...prev, [stationId]: true }));
      setTimeout(() => {
        setRecentlyAdvanced((prev) => {
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
    <CardContent className="space-y-4 p-6">
      {localStations.map((station) => {
        const counts = station.appointments.reduce<Record<string, number>>((acc, appointment) => {
          acc[appointment.status] = (acc[appointment.status] ?? 0) + 1;
          return acc;
        }, {});
        const isAdvancing = isPending && pendingStation === station.id;
        const showAdvanced = recentlyAdvanced[station.id];

        return (
          <div
            key={station.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-background/80 p-5 transition-shadow hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-base font-semibold capitalize text-foreground">
                  {station.type.toLowerCase()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Station ID: {station.id.slice(0, 6)}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <span key={status}>
                      {label}: {counts[status] ?? 0}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={station.isActive ? "success" : "outline"}>
                  {station.isActive ? "Active" : "Paused"}
                </Badge>
                {showAdvanced ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Advanced
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending && pendingStation === station.id}
                onClick={() => toggleStation(station.id, !station.isActive)}
              >
                {station.isActive ? "Pause" : "Activate"}
              </Button>
              <Button
                size="sm"
                disabled={isAdvancing}
                onClick={() => advanceQueue(station.id)}
              >
                {isAdvancing ? "Advancing…" : "Advance donor"}
              </Button>
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
