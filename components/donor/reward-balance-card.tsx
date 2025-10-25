"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RewardBalance = {
  balance: number;
  earned: number;
  spent: number;
};

type RewardBalanceCardProps = {
  donorId: string;
  className?: string;
  refreshKey?: number;
};

export function RewardBalanceCard({ donorId, className, refreshKey = 0 }: RewardBalanceCardProps) {
  const [data, setData] = useState<RewardBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!donorId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/donors/${donorId}/points`);
        if (!response.ok) {
          throw new Error("Failed to load points");
        }
        const payload = (await response.json()) as RewardBalance;
        if (active) {
          setData(payload);
        }
      } catch (err) {
        if (active) {
          setError("Unable to load reward balance right now");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [donorId, refreshKey]);

  return (
    <Card className={cn("space-y-3 border-border/60 bg-background/80 p-4", className)}>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Snack & merch points</p>
        <h4 className="text-lg font-semibold text-foreground">
          {loading ? "Loading…" : `${data?.balance ?? 0} pts`}
        </h4>
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <p className="uppercase tracking-wide text-[10px]">Earned</p>
            <p className="text-sm font-semibold text-foreground">{data?.earned ?? 0}</p>
          </div>
          <div>
            <p className="uppercase tracking-wide text-[10px]">Redeemed</p>
            <p className="text-sm font-semibold text-foreground">{data?.spent ?? 0}</p>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Redeem these points for snacks or merch once the reward counter opens.
      </p>
    </Card>
  );
}
