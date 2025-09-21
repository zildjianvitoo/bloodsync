import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/db/events";

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
  params: { id: string };
}) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  const activeStations = event.stations.filter((station) => station.isActive).length;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <Link
        href="/admin"
        className="text-sm font-medium text-blue-600 hover:text-blue-500"
      >
        ← Back to events
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {event.name}
        </h1>
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          {formatDate(new Date(event.startAt))}
          {event.endAt ? ` – ${formatDate(new Date(event.endAt))}` : ""}
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          Target units: <span className="font-semibold">{event.targetUnits}</span>
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          Active stations: {activeStations} / {event.stations.length}
        </div>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-5 py-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          Stations
        </div>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {event.stations.map((station) => (
            <li key={station.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {station.type}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  Status: {station.isActive ? "Active" : "Paused"}
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  station.isActive
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                    : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {station.isActive ? "Active" : "Paused"}
              </span>
            </li>
          ))}
          {event.stations.length === 0 ? (
            <li className="px-5 py-6 text-sm text-zinc-500">
              No stations configured yet.
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
