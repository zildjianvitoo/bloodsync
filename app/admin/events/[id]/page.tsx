import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/db/events";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminEventDetail({
  params,
}: {
  params: { id: string };
}) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  const activeStations = event.stations.filter((station) => station.isActive).length;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <Button asChild variant="ghost" size="sm" className="w-max px-0 text-sm">
        <Link href="/admin">← Back to events</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>
            {formatDate(new Date(event.startAt))}
            {event.endAt ? ` – ${formatDate(new Date(event.endAt))}` : ""}
          </CardDescription>
          <div className="text-sm text-muted-foreground">
            Target units: <span className="font-semibold text-foreground">{event.targetUnits}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Active stations: {activeStations} / {event.stations.length}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Stations
            </h2>
            <ul className="space-y-3">
              {event.stations.map((station) => (
                <li
                  key={station.id}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3"
                >
                  <div>
                    <div className="text-base font-semibold capitalize">
                      {station.type.toLowerCase()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Status: {station.isActive ? "Active" : "Paused"}
                    </div>
                  </div>
                  <Badge variant={station.isActive ? "success" : "outline"}>
                    {station.isActive ? "Active" : "Paused"}
                  </Badge>
                </li>
              ))}
              {event.stations.length === 0 ? (
                <li className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No stations configured yet.
                </li>
              ) : null}
            </ul>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
