"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

export type StationResource = {
  id: string;
  type: string;
  isActive: boolean;
};

export function StationsPanel({ stations }: { stations: StationResource[] }) {
  const router = useRouter();
  const [pendingStation, setPendingStation] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localStations, setLocalStations] = useState(stations);

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

  return (
    <CardContent className="space-y-3">
      {localStations.map((station) => (
        <div
          key={station.id}
          className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3"
        >
          <div>
            <div className="text-base font-semibold capitalize">
              {station.type.toLowerCase()}
            </div>
            <div className="text-sm text-muted-foreground">
              Status: {station.isActive ? "Active" : "Paused"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={station.isActive ? "success" : "outline"}>
              {station.isActive ? "Active" : "Paused"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending && pendingStation === station.id}
              onClick={() => toggleStation(station.id, !station.isActive)}
            >
              {station.isActive ? "Pause" : "Activate"}
            </Button>
          </div>
        </div>
      ))}
      {localStations.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No stations configured yet.
        </div>
      ) : null}
    </CardContent>
  );
}
