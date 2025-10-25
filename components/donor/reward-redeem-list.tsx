"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type RewardListItem = {
  id: string;
  name: string;
  cost: number;
  stock: number;
  isActive: boolean;
  sponsorId?: string | null;
};

type RewardRedeemListProps = {
  donorId: string;
  eventId: string;
  onRedeemed?: () => void;
};

export function RewardRedeemList({ donorId, eventId, onRedeemed }: RewardRedeemListProps) {
  const [items, setItems] = useState<RewardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [itemsResponse, balanceResponse] = await Promise.all([
          fetch(`/api/reward-items?eventId=${eventId}`),
          fetch(`/api/donors/${donorId}/points`),
        ]);

        if (!itemsResponse.ok) {
          throw new Error("Failed to load rewards");
        }
        if (!balanceResponse.ok) {
          throw new Error("Failed to load balance");
        }

        const itemsPayload = (await itemsResponse.json()) as { items: RewardListItem[] };
        const balancePayload = (await balanceResponse.json()) as { balance: number };
        if (active) {
          setItems(itemsPayload.items);
          setBalance(balancePayload.balance ?? 0);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError("Unable to load rewards right now");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchData();
    return () => {
      active = false;
    };
  }, [donorId, eventId]);

  async function redeem(rewardId: string) {
    setRedeeming(rewardId);
    setMessage(null);
    try {
      const response = await fetch(`/api/rewards/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ donorId, rewardItemId: rewardId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to redeem" }));
        setMessage(data.error ?? "Unable to redeem reward");
        return;
      }

      const data = (await response.json()) as { redemption: { rewardItemId: string }; balance: number };
      setBalance(data.balance);
      setItems((prev) =>
        prev.map((item) =>
          item.id === data.redemption.rewardItemId
            ? { ...item, stock: Math.max(item.stock - 1, 0) }
            : item
        )
      );
      setMessage("Redeemed! Show this at the snack counter.");
      onRedeemed?.();
    } catch (err) {
      console.error(err);
      setMessage("Server error, try again shortly.");
    } finally {
      setRedeeming(null);
    }
  }

  const activeItems = items.filter((item) => item.isActive);

  if (loading) {
    return <p className="text-xs text-muted-foreground">Loading rewards…</p>;
  }

  if (error) {
    return <p className="text-xs text-destructive">{error}</p>;
  }

  if (activeItems.length === 0) {
    return (
      <Card className="border-dashed border-border/70 bg-background/60 p-4 text-xs text-muted-foreground">
        Rewards counter is closed right now. Check back later.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      <div className="grid gap-3">
        {activeItems.map((item) => {
          const outOfStock = item.stock <= 0;
          const notEnoughPoints = balance !== null && balance < item.cost;
          return (
            <Card key={item.id} className="flex items-center justify-between border-border/60 bg-background/70 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.cost} pts · Stock {item.stock}
                  {item.sponsorId ? ` · Sponsor: ${item.sponsorId}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                disabled={outOfStock || notEnoughPoints || redeeming === item.id}
                onClick={() => redeem(item.id)}
              >
                {outOfStock ? "Out" : notEnoughPoints ? "Need more" : redeeming === item.id ? "Redeeming…" : "Redeem"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
