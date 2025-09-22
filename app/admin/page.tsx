import Link from "next/link";
import { listEvents } from "@/lib/db/events";
import { requireRole } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/navigation/top-nav";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireRole("admin");
  const events = await listEvents();

  return (
    <>
      <TopNav role="admin" />
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Admin Overview</h1>
        <p className="text-sm text-muted-foreground">
          Track upcoming blood drives and drill into station load.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Events</CardTitle>
            <CardDescription>Upcoming drives synced from the queue system.</CardDescription>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href="/admin/events/new">New event</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-base font-semibold">{event.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(event.startAt).toLocaleString()} — {event.targetUnits} bags target
                  </div>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/events/${event.id}`}>View</Link>
                </Button>
              </li>
            ))}
            {events.length === 0 ? (
              <li className="px-5 py-6 text-sm text-muted-foreground">
                No events yet. Seed the database to see sample data.
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </main>
    </>
  );
}
