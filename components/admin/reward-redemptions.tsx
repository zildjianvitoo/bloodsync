"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type RewardRedemptionItem = {
  id: string;
  status: "RESERVED" | "FULFILLED" | "CANCELLED";
  cost: number;
  createdAt: string;
  fulfilledBy?: string | null;
  donor: {
    id: string;
    name: string;
  };
  rewardItem: {
    id: string;
    name: string;
  };
};

type RewardRedemptionListProps = {
  eventId: string;
  initialRedemptions: RewardRedemptionItem[];
};

export function RewardRedemptionList({ eventId, initialRedemptions }: RewardRedemptionListProps) {
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    try {
      const response = await fetch(`/api/redemptions?eventId=${eventId}`);
      if (!response.ok) {
        throw new Error("Failed to load redemptions");
      }
      const data = (await response.json()) as { redemptions: RewardRedemptionItem[] };
      setRedemptions(data.redemptions);
    } catch (error) {
      console.error(error);
      setMessage("Unable to refresh redemptions");
    }
  }

  async function updateStatus(id: string, status: "FULFILLED" | "CANCELLED") {
    setPendingId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/redemptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to update redemption" }));
        setMessage(data.error ?? "Unable to update redemption");
        return;
      }
      const payload = (await response.json()) as { redemption: RewardRedemptionItem };
      setRedemptions((prev) => prev.map((item) => (item.id === id ? payload.redemption : item)));
    } catch (error) {
      console.error(error);
      setMessage("Failed to update redemption");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {redemptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No redemptions yet.</p>
      ) : (
        redemptions.map((redemption) => {
          const created = new Date(redemption.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const canFulfill = redemption.status === "RESERVED";
          return (
            <Card key={redemption.id} className="flex flex-col gap-3 border-border/60 bg-background/80 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {redemption.donor.name} · {redemption.rewardItem.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {redemption.cost} pts · Requested {created}
                </p>
                <Badge variant={redemption.status === "FULFILLED" ? "success" : redemption.status === "CANCELLED" ? "outline" : "default"} className="mt-1">
                  {redemption.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canFulfill || pendingId === redemption.id}
                  onClick={() => updateStatus(redemption.id, "FULFILLED")}
                >
                  {pendingId === redemption.id ? "Updating…" : "Mark fulfilled"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={redemption.status !== "RESERVED" || pendingId === redemption.id}
                  onClick={() => updateStatus(redemption.id, "CANCELLED")}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          );
        })
      )}
      <Button size="sm" variant="secondary" onClick={reload}>
        Refresh list
      </Button>
    </div>
  );
}
