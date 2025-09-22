import { requireRole } from "@/lib/auth/session";
import { EventForm } from "@/components/events/event-form";
import { TopNav } from "@/components/navigation/top-nav";

export default async function NewEventPage() {
  await requireRole("admin");
  return (
    <>
      <TopNav role="admin" />
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 pb-16 pt-20">
        <EventForm />
      </main>
    </>
  );
}
