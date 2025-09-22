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
import { StationsPanel } from "@/components/stations/stations-panel";
import { TopNav } from "@/components/navigation/top-nav";

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
      <TopNav role="volunteer" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-16">
        <AnimatedHeading
          eyebrow="Volunteer command"
          title="Stay synced with station leaders and donors without leaving your post."
          description="See station status, keep donors flowing, and broadcast quick updates when logistics change."
        />

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Stations active", value: stations.filter((s) => s.isActive).length },
            { label: "Stations paused", value: stations.filter((s) => !s.isActive).length },
            { label: "Donors waiting", value: stations.reduce((acc, s) => acc + s.appointments.length, 0) },
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
                  <StationsPanel stations={eventStations} />
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
