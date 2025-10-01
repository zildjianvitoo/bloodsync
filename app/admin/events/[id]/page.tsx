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
import { EventSettingsForm } from "@/components/events/event-settings-form";
import { AddStationForm } from "@/components/events/add-station-form";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { getEventQueue } from "@/lib/db/queue";
import { calculateEventKpis } from "@/lib/kpi";
import { KpiDashboard } from "@/components/admin/kpi-dashboard";

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

  const queue = await getEventQueue(id);
  const kpis = queue ? calculateEventKpis(queue) : null;

  const activeStations = event.stations.filter((station) => station.isActive).length;
  const settingsInitial = {
    name: event.name,
    targetUnits: event.targetUnits,
    startAt: new Date(event.startAt).toISOString().slice(0, 16),
    endAt: event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : "",
  };

  const stationPanelData = event.stations.map((station) => ({
    ...station,
    appointments: station.appointments.map(({ checkin, ...rest }) => ({
      ...rest,
      checkinAt: checkin?.timestamp ?? null,
    })),
  }));

  return (
    <>
      <TopNav role="admin" />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 pt-10">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="w-max px-0 text-sm">
          <Link href="/admin">← Back to events</Link>
        </Button>
        <DeleteEventButton eventId={event.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
          <CardDescription>Update basic metadata and timing.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventSettingsForm eventId={event.id} initialValues={settingsInitial} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Add station</CardTitle>
            <CardDescription>Spin up additional screening or donor stations mid-event.</CardDescription>
          </div>
          <div className="text-xs text-muted-foreground">
            Active stations: {activeStations} / {event.stations.length}
          </div>
        </CardHeader>
        <CardContent>
          <AddStationForm eventId={event.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>
            {formatDate(new Date(event.startAt))}
            {event.endAt ? ` – ${formatDate(new Date(event.endAt))}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {kpis ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Live KPIs
              </h2>
              <KpiDashboard eventId={event.id} initial={kpis} />
            </section>
          ) : null}

          <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 text-sm text-muted-foreground md:grid-cols-3">
            <div>
              <p className="uppercase tracking-wide text-[11px] text-muted-foreground/80">Target</p>
              <p className="text-foreground">{event.targetUnits} bags</p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-[11px] text-muted-foreground/80">Active stations</p>
              <p className="text-foreground">{activeStations} / {event.stations.length}</p>
            </div>
            <div>
              <p className="uppercase tracking-wide text-[11px] text-muted-foreground/80">Schedule</p>
              <p className="text-foreground">{event.endAt ? "Timed" : "Flexible"}</p>
            </div>
          </div>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Stations
            </h2>
            <StationsPanel stations={stationPanelData} mode="admin" />
          </section>
        </CardContent>
      </Card>
      </main>
    </>
  );
}
