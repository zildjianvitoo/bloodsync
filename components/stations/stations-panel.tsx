"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { pushInAppNotification } from "@/lib/realtime/in-app";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import NoSSR from "../ui/no-ssr";

export type StationResource = {
  id: string;
  type: string;
  isActive: boolean;
  appointments: {
    id: string;
    status: string;
    slotTime: Date;
  }[];
  awaitingDonorCount?: number;
};

const statusLabels: Record<string, string> = {
  CHECKED_IN: "Waiting",
  SCREENING: "Screening",
  DONOR: "Donor",
};

export function StationsPanel({
  stations,
  mode = "volunteer",
  onStationRemoved,
}: {
  stations: StationResource[];
  mode?: "volunteer" | "admin";
  onStationRemoved?: (stationId: string) => void;
}) {
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
      setAdvanceState((prev) => ({
        ...prev,
        [stationId]: new Date().toISOString(),
      }));
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

  async function deleteStation(stationId: string) {
    setPendingStation(stationId);
    try {
      const response = await fetch(`/api/stations/${stationId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({ error: "Failed to remove station" }));
        pushInAppNotification({
          level: "error",
          title: "Could not remove station",
          message: data.error ?? "Try again shortly",
        });
        return;
      }
      pushInAppNotification({
        level: "success",
        title: "Station removed",
        message: "Volunteers will see the update instantly.",
      });
      setLocalStations((prev) =>
        prev.filter((station) => station.id !== stationId)
      );
      onStationRemoved?.(stationId);
    } catch (error) {
      console.error(error);
    } finally {
      setPendingStation(null);
      router.refresh();
    }
  }

  return (
    <CardContent className="space-y-5 p-6">
      {localStations.map((station) => {
        const counts = station.appointments.reduce<Record<string, number>>(
          (acc, appointment) => {
            acc[appointment.status] = (acc[appointment.status] ?? 0) + 1;
            return acc;
          },
          {}
        );
        const isAdvancing = isPending && pendingStation === station.id;
        const screeningInProgress = station.appointments.find(
          (appointment) => appointment.status === "SCREENING"
        );
        const nextScreening = station.appointments
          .filter((appointment) => appointment.status === "CHECKED_IN")
          .sort((a, b) => a.slotTime.getTime() - b.slotTime.getTime())[0];
        const donatingInProgress = station.appointments.find(
          (appointment) => appointment.status === "DONOR"
        );
        const donorQueueCount = station.awaitingDonorCount ?? 0;

        let actionLabel = "No donors waiting";
        let actionDescription = "Keep an eye on the live queue.";
        let actionContext: StationResource["appointments"][number] | null =
          null;
        let canAdvance = false;

        if (station.type === "SCREENING") {
          if (screeningInProgress) {
            actionLabel = "Send to donation";
            actionDescription = "Mark screening complete and free up this bay.";
            actionContext = screeningInProgress;
            canAdvance = true;
          } else if (nextScreening) {
            actionLabel = "Call next donor";
            actionDescription =
              "Invite the next checked-in donor to screening.";
            actionContext = nextScreening;
            canAdvance = true;
          }
        } else {
          if (donatingInProgress) {
            actionLabel = "Complete donation";
            actionDescription = "Record the bag and release the bed.";
            actionContext = donatingInProgress;
            canAdvance = true;
          } else if (donorQueueCount > 0) {
            actionLabel = "Call next donor";
            actionDescription = `${donorQueueCount} donor${
              donorQueueCount === 1 ? "" : "s"
            } cleared screening.`;
            canAdvance = true;
          }
        }

        const recentAdvance = advanceState[station.id];

        return (
          <div
            key={station.id}
            className="flex flex-col gap-5 rounded-2xl border border-border bg-background/80 p-6 transition-shadow hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Station
                  </p>
                  <h3 className="text-lg font-semibold capitalize text-foreground">
                    {station.type.toLowerCase()}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    #{station.id.slice(0, 6)}
                  </p>
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
                {mode === "volunteer" && recentAdvance ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Donor advanced
                  </span>
                ) : null}
                {mode === "admin" ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={pendingStation === station.id}
                      >
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove station?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Volunteers will see this station disappear
                          immediately. Donors assigned here will be rerouted to
                          active stations.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteStation(station.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
            </div>

            {mode === "volunteer" ? (
              <div className="grid gap-4 rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {station.type === "SCREENING"
                      ? screeningInProgress
                        ? "Currently screening"
                        : "Up next"
                      : donatingInProgress
                      ? "Currently donating"
                      : "Up next"}
                  </p>
                  {actionContext ? (
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="text-foreground">
                        Donor ticket{" "}
                        <span className="font-semibold">
                          {actionContext.id.slice(0, 6)}
                        </span>
                      </p>
                      <NoSSR>
                        <p>
                          Arrived{" "}
                          {new Date(
                            actionContext.slotTime
                          ).toLocaleTimeString()}
                        </p>
                      </NoSSR>
                    </div>
                  ) : donorQueueCount > 0 && station.type === "DONOR" ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {donorQueueCount} donor{donorQueueCount === 1 ? "" : "s"}{" "}
                      ready after screening.
                    </p>
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
                    disabled={isAdvancing || !canAdvance}
                    onClick={() => advanceQueue(station.id)}
                  >
                    {isAdvancing
                      ? station.type === "DONOR" && donatingInProgress
                        ? "Completing…"
                        : "Calling…"
                      : actionLabel}
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
                    {actionDescription}
                  </p>
                </div>
              </div>
            ) : null}
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
