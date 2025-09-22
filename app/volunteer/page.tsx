import { listStationsWithEvent } from "@/lib/db/stations";
import { requireRole } from "@/lib/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedHeading } from "@/components/ui/heading";
import { GlassCard } from "@/components/ui/glass-card";

export const dynamic = "force-dynamic";

export default async function VolunteerPage() {
  await requireRole("volunteer");
  const stations = await listStationsWithEvent();

  const grouped = stations.reduce<Record<string, typeof stations>>((acc, station) => {
    const key = station.event?.id ?? "unknown";
    acc[key] = acc[key] ? [...acc[key], station] : [station];
    return acc;
  }, {});

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-12">
        <AnimatedHeading
          eyebrow="Volunteer command"
          title="Stay synced with station leaders and donors without leaving your post."
          description="See station status, keep donors flowing, and broadcast quick updates when logistics change."
        />

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Stations active", value: stations.filter((s) => s.isActive).length },
            { label: "Stations paused", value: stations.filter((s) => !s.isActive).length },
            { label: "Next donor groups", value: "A12 • B07 • C03" },
          ].map((item) => (
            <GlassCard key={item.label}>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.label}
              </span>
              <div className="mt-2 text-xl font-semibold text-foreground">{item.value}</div>
            </GlassCard>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {Object.values(grouped).map((eventStations) => {
            const event = eventStations[0]?.event;
            return (
              <Card key={event?.id ?? "unknown"} className="overflow-hidden border-border/70 bg-card/90 shadow-xl">
                <CardHeader>
                  <CardTitle>{event?.name ?? "Ad-hoc event"}</CardTitle>
                  <CardDescription>
                    {event?.startAt
                      ? new Date(event.startAt).toLocaleString()
                      : "Flexible schedule"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventStations.map((station) => (
                    <div
                      key={station.id}
                      className="rounded-xl border border-border bg-background/70 p-4 transition-shadow hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold capitalize text-foreground">
                            {station.type.toLowerCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Station ID: {station.id.slice(0, 6)}
                          </div>
                        </div>
                        <Badge variant={station.isActive ? "success" : "outline"}>
                          {station.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <Button size="sm" variant="outline" className="w-full" disabled>
                          Advance donor
                        </Button>
                        <Button size="sm" variant="ghost" className="w-full" disabled>
                          Broadcast update
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
                <CardFooter className="justify-between text-xs text-muted-foreground">
                  <span>Tip: align with screening lead every 30 minutes.</span>
                  <Button size="sm" variant="outline" disabled>
                    View donor queue
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
}
