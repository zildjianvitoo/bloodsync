"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeRealtime } from "@/lib/realtime/client";

export type VolunteerRedemption = {
  id: string;
  status: "RESERVED" | "FULFILLED" | "CANCELLED";
  cost: number;
  createdAt: string;
  donor: {
    name: string;
  };
  rewardItem: {
    name: string;
  };
};

type RewardQueuePanelProps = {
  eventId: string;
};

export function RewardQueuePanel({ eventId }: RewardQueuePanelProps) {
  const [redemptions, setRedemptions] = useState<VolunteerRedemption[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`/api/redemptions?eventId=${eventId}&limit=10`);
        if (!response.ok) {
          throw new Error("Failed to load rewards");
        }
        const data = (await response.json()) as { redemptions: VolunteerRedemption[] };
        if (active) {
          setRedemptions(data.redemptions);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError("Unable to fetch rewards queue right now");
        }
      }
    }

    void load();
    const unsubscribe = subscribeRealtime("reward:redeemed", () => {
      void load();
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [eventId]);

  async function markRedemption(id: string, status: "FULFILLED" | "CANCELLED") {
    setPendingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/redemptions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to update" }));
        setError(data.error ?? "Unable to update reward");
        return;
      }
      const payload = (await response.json()) as { redemption: VolunteerRedemption };
      setRedemptions((prev) => prev.map((item) => (item.id === id ? payload.redemption : item)));
    } catch (err) {
      console.error(err);
      setError("Failed to update redemption");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {redemptions.length === 0 ? (
        <p className="text-xs text-muted-foreground">No snacks waiting. We&apos;ll ping you when donors redeem.</p>
      ) : (
        redemptions.map((item) => {
          const isPending = pendingId === item.id;
          const canFulfill = item.status === "RESERVED";
          return (
            <Card key={item.id} className="flex flex-col gap-3 border-border/60 bg-background/80 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {item.donor.name} · {item.rewardItem.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.cost} pts · {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <Badge variant={item.status === "FULFILLED" ? "success" : item.status === "CANCELLED" ? "outline" : "default"} className="mt-1">
                  {item.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canFulfill || isPending}
                  onClick={() => markRedemption(item.id, "FULFILLED")}
                >
                  {isPending ? "Updating…" : "Give snack"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canFulfill || isPending}
                  onClick={() => markRedemption(item.id, "CANCELLED")}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
