"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoginForm({
  role,
  className,
}: {
  role: "admin" | "volunteer";
  className?: string;
}) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, passcode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Login failed" }));
        setError(data.error ?? "Login failed");
        return;
      }

      router.replace(role === "admin" ? "/admin" : "/volunteer");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border/70 bg-card/90 p-6 shadow-xl", className)}
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {role === "admin" ? "Admin" : "Volunteer"} Login
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the secure passcode to access the {role} console.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="passcode" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Passcode
        </label>
        <input
          id="passcode"
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          placeholder="••••••••"
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
