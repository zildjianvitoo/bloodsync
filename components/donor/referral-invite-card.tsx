"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReferralInviteCard({ eventId, donorId }: { eventId: string; donorId: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId, referrerId: donorId, inviteeEmail: email || undefined }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to send invite" }));
        setStatus(data.error ?? "Unable to send invite");
        return;
      }
      setEmail("");
      setStatus("Invite logged! Once your friend donates, points will land here.");
    } catch (error) {
      console.error(error);
      setStatus("Unable to send invite right now");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Refer a friend</p>
      <Input
        type="email"
        placeholder="Friend's email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={pending}
      />
      <Button type="submit" size="sm" disabled={pending || email.length === 0}>
        {pending ? "Sending…" : "Send invite"}
      </Button>
      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
    </form>
  );
}
