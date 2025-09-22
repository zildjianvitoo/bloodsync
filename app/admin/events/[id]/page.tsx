import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/db/events";
import { requireRole } from "@/lib/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StationsPanel } from "@/components/stations/stations-panel";
import { TopNav } from "@/components/navigation/top-nav";

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
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const activeStations = event.stations.filter((station) => station.isActive).length;

  return (
    <>
      <TopNav role="admin" />
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
            <StationsPanel stations={event.stations} />
          </section>
        </CardContent>
      </Card>
      </main>
    </>
  );
}
