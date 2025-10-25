"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BADGE_META, type BadgeKey } from "@/lib/badges/meta";

export type DonorBadge = {
  id: string;
  key: BadgeKey;
  awardedAt: string;
};

type BadgeListProps = {
  donorId: string;
};

export function BadgeList({ donorId }: BadgeListProps) {
  const [badges, setBadges] = useState<DonorBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/donors/${donorId}/badges`);
        if (!response.ok) {
          throw new Error("Failed to load badges");
        }
        const data = (await response.json()) as { badges: { id: string; key: BadgeKey; awardedAt: string }[] };
        if (active) {
          setBadges(data.badges);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError("Unable to load badges right now");
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
  }, [donorId]);

  if (loading) {
    return <p className="text-xs text-muted-foreground">Loading badges…</p>;
  }

  if (error) {
    return <p className="text-xs text-destructive">{error}</p>;
  }

  if (badges.length === 0) {
    return (
      <Card className="border-dashed border-border/60 bg-background/70 p-3 text-xs text-muted-foreground">
        No badges yet. Complete donations and arrive on time to unlock rewards.
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {badges.map((badge) => {
        const meta = BADGE_META[badge.key];
        return (
          <Card key={badge.id} className="rounded-xl border-border/60 bg-background/80 p-4 text-sm">
            <p className="font-semibold text-foreground">{meta.label}</p>
            <p className="text-xs text-muted-foreground">{meta.description}</p>
            <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              Earned {new Date(badge.awardedAt).toLocaleDateString()}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
