import Link from "next/link";
import { listEvents } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const events = await listEvents();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Admin Overview
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Track upcoming blood drives and drill into station load.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-5 py-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Events
        </div>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {events.map((event) => (
            <li key={event.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {event.name}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  {new Date(event.startAt).toLocaleString()} — {event.targetUnits} bags target
                </div>
              </div>
              <Link
                href={`/admin/events/${event.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View
              </Link>
            </li>
          ))}
          {events.length === 0 ? (
            <li className="px-5 py-6 text-sm text-zinc-500">
              No events yet. Seed the database to see sample data.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
