"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ReferralItem = {
  id: string;
  inviteeEmail: string | null;
  inviteSentAt: string;
  status: string;
  referrer: {
    id: string;
    name: string;
  };
};

type ReferralListProps = {
  eventId: string;
  stats: {
    invites: number;
    accepted: number;
    completed: number;
    kFactor: number;
  };
  initialReferrals: ReferralItem[];
};

export function ReferralList({ eventId, stats, initialReferrals }: ReferralListProps) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    try {
      const response = await fetch(`/api/events/${eventId}/referrals`);
      if (!response.ok) {
        throw new Error("Failed to refresh referrals");
      }
      const data = (await response.json()) as { referrals: ReferralItem[] };
      setReferrals(data.referrals);
    } catch (error) {
      console.error(error);
      setMessage("Unable to refresh referrals");
    }
  }

  async function markComplete(id: string, referrerId: string) {
    setMessage(null);
    try {
      const response = await fetch(`/api/referrals/${id}/complete`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referrerId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to update" }));
        setMessage(data.error ?? "Unable to update referral");
        return;
      }
      setReferrals((prev) => prev.map((item) => (item.id === id ? { ...item, status: "COMPLETED" } : item)));
    } catch (error) {
      console.error(error);
      setMessage("Failed to update referral");
    }
  }

  return (
    <div className="space-y-3">
      <Card className="space-y-2 border-border/60 bg-background/80 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Invites</span>
          <span className="font-semibold text-foreground">{stats.invites}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Accepted</span>
          <span className="font-semibold text-foreground">{stats.accepted}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Completed</span>
          <span className="font-semibold text-foreground">{stats.completed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">K-factor</span>
          <span className="font-semibold text-foreground">{stats.kFactor.toFixed(2)}</span>
        </div>
      </Card>

      {message ? <p className="text-xs text-destructive">{message}</p> : null}

      {referrals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No referrals logged yet.</p>
      ) : (
        referrals.map((referral) => (
          <Card key={referral.id} className="flex items-center justify-between border-border/60 bg-background/80 p-4 text-sm">
            <div>
              <p className="font-semibold text-foreground">{referral.referrer.name}</p>
              <p className="text-xs text-muted-foreground">Invited {referral.inviteeEmail ?? "friend"}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{referral.status}</p>
            </div>
            {referral.status !== "COMPLETED" ? (
              <Button size="sm" onClick={() => markComplete(referral.id, referral.referrer.id)}>
                Mark complete
              </Button>
            ) : null}
          </Card>
        ))
      )}

      <Button size="sm" variant="secondary" onClick={refresh}>
        Refresh referral stats
      </Button>
    </div>
  );
}
