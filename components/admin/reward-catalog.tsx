"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RewardCatalogItem = {
  id: string;
  name: string;
  cost: number;
  stock: number;
  isActive: boolean;
  sponsorId?: string | null;
  createdAt: string;
};

type RewardCatalogAdminProps = {
  eventId: string;
  initialItems: RewardCatalogItem[];
};

type Draft = {
  cost: string;
  stock: string;
  sponsorId: string;
};

export function RewardCatalogAdmin({ eventId, initialItems }: RewardCatalogAdminProps) {
  const [items, setItems] = useState(initialItems);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => buildDrafts(initialItems));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setDrafts(buildDrafts(initialItems));
  }, [initialItems]);

  function handleDraftChange(id: string, field: keyof Draft, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { cost: "", stock: "", sponsorId: "" }),
        [field]: value,
      },
    }));
  }

  async function reload() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/reward-items?eventId=${eventId}&includeInactive=true`);
      if (!response.ok) {
        throw new Error("Failed to refresh rewards");
      }
      const data = (await response.json()) as { items: RewardCatalogItem[] };
      setItems(data.items);
      setDrafts(buildDrafts(data.items));
    } catch (error) {
      console.error(error);
      setMessage("Unable to refresh catalog");
    } finally {
      setLoading(false);
    }
  }

  async function saveItem(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        cost: Number.parseInt(draft.cost, 10),
        stock: Number.parseInt(draft.stock, 10),
        sponsorId: draft.sponsorId.trim() || null,
      };
      const response = await fetch(`/api/reward-items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to update" }));
        setMessage(data.error ?? "Unable to update reward");
        return;
      }
      await reload();
      setMessage("Reward updated");
    } catch (error) {
      console.error(error);
      setMessage("Failed to update reward");
    } finally {
      setLoading(false);
    }
  }

  async function toggleItem(id: string, isActive: boolean) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/reward-items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to toggle" }));
        setMessage(data.error ?? "Unable to update status");
        return;
      }
      await reload();
    } catch (error) {
      console.error(error);
      setMessage("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <CreateRewardItemForm eventId={eventId} onCreated={reload} disabled={loading} />
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rewards yet. Add your first snack or merch item.</p>
        ) : (
          items.map((item) => {
            const draft = drafts[item.id];
            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border border-border/60 bg-background/80 p-4 md:flex-row md:items-center md:justify-between",
                  !item.isActive && "opacity-70"
                )}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(item.createdAt).toLocaleDateString()} · Stock {item.stock}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <Badge variant={item.isActive ? "success" : "outline"}>
                      {item.isActive ? "Active" : "Paused"}
                    </Badge>
                    {item.sponsorId ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                        Sponsor: {item.sponsorId}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={draft?.cost ?? item.cost}
                      onChange={(event) => handleDraftChange(item.id, "cost", event.target.value)}
                      className="w-24"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={draft?.stock ?? item.stock}
                      onChange={(event) => handleDraftChange(item.id, "stock", event.target.value)}
                      className="w-24"
                    />
                    <Input
                      placeholder="Sponsor"
                      value={draft?.sponsorId ?? item.sponsorId ?? ""}
                      onChange={(event) => handleDraftChange(item.id, "sponsorId", event.target.value)}
                      className="w-28"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveItem(item.id)} disabled={loading}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleItem(item.id, !item.isActive)}
                      disabled={loading}
                    >
                      {item.isActive ? "Pause" : "Activate"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function buildDrafts(items: RewardCatalogItem[]): Record<string, Draft> {
  return items.reduce<Record<string, Draft>>((acc, item) => {
    acc[item.id] = {
      cost: item.cost.toString(),
      stock: item.stock.toString(),
      sponsorId: item.sponsorId ?? "",
    };
    return acc;
  }, {});
}

type CreateRewardItemFormProps = {
  eventId: string;
  onCreated: () => void;
  disabled?: boolean;
};

function CreateRewardItemForm({ eventId, onCreated, disabled }: CreateRewardItemFormProps) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("30");
  const [stock, setStock] = useState("10");
  const [sponsorId, setSponsorId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => name.trim().length >= 2 && Number(cost) > 0, [name, cost]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/reward-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          name: name.trim(),
          cost: Number.parseInt(cost, 10),
          stock: Number.parseInt(stock, 10),
          sponsorId: sponsorId.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Unable to create reward" }));
        setError(data.error ?? "Unable to create reward");
        return;
      }

      setName("");
      setCost("30");
      setStock("10");
      setSponsorId("");
      onCreated();
    } catch (err) {
      console.error(err);
      setError("Server error, try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          placeholder="Reward name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={pending || disabled}
        />
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            disabled={pending || disabled}
            className="w-24"
          />
          <Input
            type="number"
            min={0}
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            disabled={pending || disabled}
            className="w-24"
          />
        </div>
        <Input
          placeholder="Sponsor (optional)"
          value={sponsorId}
          onChange={(event) => setSponsorId(event.target.value)}
          disabled={pending || disabled}
          className="md:flex-1"
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="submit" disabled={!canSubmit || pending || disabled}>
        {pending ? "Adding…" : "Add reward"}
      </Button>
    </form>
  );
}
