import { listEvents } from "@/lib/db/events";
import { TicketCheckInForm } from "@/components/donor/ticket-checkin-form";

export const dynamic = "force-dynamic";

export default async function TicketPage() {
  const events = await listEvents();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16">
      <div className="space-y-4 text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-primary">BloodSync</span>
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          Retrieve your live donor ticket
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Check-in connects your confirmation token to the live queue for today&apos;s blood drive. Keep this window open to
          watch your turn update in real time.
        </p>
      </div>

      <TicketCheckInForm
        events={events.map((event) => ({
          id: event.id,
          name: event.name,
          startAt: event.startAt.toISOString(),
        }))}
      />
    </main>
  );
}
