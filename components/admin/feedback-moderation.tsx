"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type ModerationItem = {
  id: string;
  comment: string | null;
  status: string;
  createdAt: string;
  donor?: {
    id: string;
    name: string;
  } | null;
};

type FeedbackModerationProps = {
  eventId: string;
  initial: ModerationItem[];
};

export function FeedbackModerationPanel({ eventId, initial }: FeedbackModerationProps) {
  const [items, setItems] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function refresh() {
    try {
      const response = await fetch(`/api/events/${eventId}/feedback/moderation`);
      if (!response.ok) {
        throw new Error("Failed to refresh feedback");
      }
      const data = (await response.json()) as { feedback: ModerationItem[] };
      setItems(data.feedback);
    } catch (error) {
      console.error(error);
      setMessage("Unable to refresh queue");
    }
  }

  async function moderate(id: string, status: "APPROVED" | "REJECTED") {
    setPendingId(id);
    setMessage(null);
    try {
      const response = await fetch(`/api/feedback/${id}/moderate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to update" }));
        setMessage(data.error ?? "Unable to update feedback");
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      setMessage("Failed to update feedback");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending comments.</p>
      ) : (
        items.map((item) => (
          <Card key={item.id} className="space-y-2 border-border/60 bg-background/80 p-4 text-sm">
            <p className="font-semibold text-foreground">{item.donor?.name ?? "Anonymous donor"}</p>
            <p className="rounded-md border border-border/40 bg-background/90 p-3 text-muted-foreground">
              {item.comment ?? "(no comment)"}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => moderate(item.id, "APPROVED")}
                disabled={pendingId === item.id}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => moderate(item.id, "REJECTED")}
                disabled={pendingId === item.id}
              >
                Reject
              </Button>
            </div>
          </Card>
        ))
      )}
      <Button size="sm" variant="secondary" onClick={refresh}>
        Refresh queue
      </Button>
    </div>
  );
}
