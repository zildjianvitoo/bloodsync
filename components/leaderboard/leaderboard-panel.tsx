"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LeaderboardPanelProps = {
  scope: "individual" | "team";
  eventId?: string;
  limit?: number;
  title?: string;
  className?: string;
};

type BaseEntry = {
  totalPoints: number;
};

type IndividualEntry = BaseEntry & {
  donorId: string;
  donorName: string;
  teamName: string | null;
};

type TeamEntry = BaseEntry & {
  teamId: string;
  teamName: string;
};

export function LeaderboardPanel({ scope, eventId, limit = 5, title, className }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<(IndividualEntry | TeamEntry)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({ scope, limit: limit.toString() });
        if (eventId) {
          query.set("eventId", eventId);
        }
        const response = await fetch(`/api/leaderboard?${query.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to load leaderboard");
        }
        const data = (await response.json()) as { leaderboard: (IndividualEntry | TeamEntry)[] };
        if (active) {
          setEntries(data.leaderboard);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError("Unable to load leaderboard");
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
  }, [scope, eventId, limit]);

  return (
    <Card className={cn("space-y-3 border-border/60 bg-background/80 p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {title ?? (scope === "team" ? "Top teams" : "Top donors")}
        </p>
      </div>
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={"donorId" in entry ? entry.donorId : entry.teamId}
              className="flex items-center justify-between rounded-lg border border-border/40 bg-background/70 px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {"donorId" in entry ? entry.donorName : entry.teamName}
                </p>
                {"donorId" in entry && entry.teamName ? (
                  <p className="text-[11px] text-muted-foreground">{entry.teamName}</p>
                ) : null}
              </div>
              <Badge variant="secondary" className="text-xs font-semibold">
                #{index + 1} · {entry.totalPoints} pts
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
