import Link from "next/link";
import { AnimatedHeading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  {
    label: "Bags today",
    value: "178",
    delta: "+12% vs yesterday",
  },
  {
    label: "Avg queue time",
    value: "12 min",
    delta: "–4 min this hour",
  },
  {
    label: "Volunteer satisfaction",
    value: "4.8/5",
    delta: "survey live",
  },
];

const features = [
  {
    title: "Live donor journey",
    description:
      "Dynamic ticketing with real-time ETA, turn alerts, and reminder nudges to keep donors confident.",
  },
  {
    title: "Station command",
    description:
      "See which stations are overwhelmed, pause for screening breaks, and balance load in seconds.",
  },
  {
    title: "Impact intel",
    description:
      "Impact dashboards surface throughput, referral lift, and CSAT pulses for judges and sponsors.",
  },
];

export default async function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-1/3 top-[-20%] h-[480px] w-[480px] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute right-[-20%] top-1/4 h-[520px] w-[520px] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-[-15%] left-1/3 h-[380px] w-[380px] rounded-full bg-primary/15 blur-3xl" />
      </div>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-20 px-6 py-16">
        <section className="flex flex-col gap-10 md:flex-row md:items-center">
          <div className="flex-1 space-y-8">
            <AnimatedHeading
              eyebrow="Sinergi Fest"
              title="BloodSync orchestrates donors, volunteers, and stations in real time."
              description="Keep every donor informed, every volunteer synchronized, and every organizer equipped with actionable insights to increase completed bags per hour."
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link href="/volunteer">Volunteer workspace</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <GlassCard key={item.label} className="p-5">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </span>
                  <div className="mt-2 text-2xl font-semibold text-foreground">
                    {item.value}
                  </div>
                  <div className="text-xs text-primary/80">{item.delta}</div>
                </GlassCard>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-white/70 via-primary/5 to-accent/10 shadow-2xl dark:from-white/10 dark:via-primary/5 dark:to-accent/10">
              <CardContent className="relative space-y-6 p-8">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-primary">
                    Live queue snapshot
                  </p>
                  <h3 className="text-2xl font-semibold text-foreground">
                    Screening Station load
                  </h3>
                </div>
                <div className="space-y-4">
                  {["Donor check-in", "Vitals review", "Bed prep"].map((item, idx) => (
                    <div key={item} className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{item}</span>
                        <span>{idx === 0 ? "4 waiting" : idx === 1 ? "2 in progress" : "Ready"}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: ["60%", "40%", "90%"][idx] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground dark:bg-background/40">
                  Volunteers paused Screening Station B for 5 minutes to stretch. BloodSync auto-reassigned donors and notified the kiosk.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10 space-y-3">
                <h2 className="text-xl font-semibold text-foreground">{feature.title}</h2>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
