import { listStationsWithEvent } from "@/lib/db/stations";
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

export default async function VolunteerPage() {
  const stations = await listStationsWithEvent();

  const grouped = stations.reduce<Record<string, typeof stations>>((acc, station) => {
    const key = station.event?.id ?? "unknown";
    acc[key] = acc[key] ? [...acc[key], station] : [station];
    return acc;
  }, {});

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Volunteer Console</h1>
        <p className="text-sm text-muted-foreground">
          Balance stations, call donors forward, and signal pauses when medical staff need a break.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {Object.values(grouped).map((eventStations) => {
          const event = eventStations[0]?.event;
          return (
            <Card key={event?.id ?? "unknown"}>
              <CardHeader>
                <CardTitle>{event?.name ?? "Ad-hoc"}</CardTitle>
                <CardDescription>
                  {event?.startAt
                    ? new Date(event.startAt).toLocaleString()
                    : "Flexible schedule"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventStations.map((station) => (
                  <div
                    key={station.id}
                    className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3"
                  >
                    <div>
                      <div className="text-base font-semibold capitalize text-foreground">
                        {station.type.toLowerCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Station ID: {station.id.slice(0, 6)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={station.isActive ? "success" : "outline"}>
                        {station.isActive ? "Active" : "Paused"}
                      </Badge>
                      <Button size="sm" variant="outline" disabled>
                        Advance donor
                      </Button>
                    </div>
                  </div>
                ))}
                {eventStations.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                    No stations assigned yet.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
