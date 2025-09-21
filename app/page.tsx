import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-16 px-6 py-16">
      <header className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
        <div className="flex flex-col gap-4">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">
            Sinergi Fest operations hub
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Coordinate donors, volunteers, and stations in real time.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            BloodSync keeps every donor informed, every station balanced, and every organizer
            in control. Monitor queue health, trigger reminders, and celebrate completed bags
            without leaving the console.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/admin">Open admin console</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/volunteer">Volunteer workspace</Link>
            </Button>
          </div>
        </div>
        <div className="relative ml-auto flex h-48 w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 p-6 shadow-sm md:h-64">
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl font-semibold text-primary">178</span>
            <span className="text-sm text-muted-foreground">Completed bags today</span>
            <div className="mt-4 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              Queue time: 12 min avg
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Queue transparency",
            description:
              "Realtime ticketing with dynamic ETA so donors know exactly when they are next up.",
          },
          {
            title: "Station balance",
            description:
              "Volunteers see station load instantly and can pause or resume stations on the fly.",
          },
          {
            title: "Impact tracking",
            description:
              "Throughput, CSAT, and referral data flow into dashboards for judging-ready insights.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
