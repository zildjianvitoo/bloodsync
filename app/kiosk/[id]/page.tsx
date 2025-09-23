import { getEventQueue } from "@/lib/db/queue";
import { notFound } from "next/navigation";
import { KioskQueue } from "@/components/kiosk/kiosk-queue";

export const dynamic = "force-dynamic";

export default async function KioskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queue = await getEventQueue(id);
  if (!queue) {
    notFound();
  }
  return <KioskQueue eventId={id} initialQueue={queue} />;
}
