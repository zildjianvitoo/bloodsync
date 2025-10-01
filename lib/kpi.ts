import type { EventQueuePayload } from "@/lib/db/queue";

export type EventKpis = {
  checkInRate: number;
  attendanceRate: number;
  averageWaitMinutes: number;
  throughputPerHour: number;
  targetProgress: number;
  waitingCount: number;
  screeningCount: number;
  donorCount: number;
  doneCount: number;
  totalAppointments: number;
  timestamp: string;
};

function safeDivide(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export function calculateEventKpis(queue: EventQueuePayload): EventKpis {
  const statusCounts = queue.statusCounts ?? {};
  const totalAppointments = Object.values(statusCounts).reduce((sum, value) => sum + value, 0);

  const checkedInTotal =
    (statusCounts.CHECKED_IN ?? 0) +
    (statusCounts.SCREENING ?? 0) +
    (statusCounts.DONOR ?? 0) +
    (statusCounts.DONE ?? 0);

  const attendanceTotal =
    (statusCounts.SCREENING ?? 0) +
    (statusCounts.DONOR ?? 0) +
    (statusCounts.DONE ?? 0);

  const activeScreeningStations = queue.stations.filter(
    (station) => station.type === "SCREENING" && station.isActive
  ).length;

  const averageWaitMinutes =
    activeScreeningStations > 0
      ? Math.ceil(queue.stats.waiting / activeScreeningStations) * 12
      : queue.stats.waiting * 12;

  const eventStart = new Date(queue.event.startAt).getTime();
  const now = Date.now();
  const durationHours = Math.max((now - eventStart) / (1000 * 60 * 60), 0.1);
  const throughputPerHour = queue.stats.done / durationHours;

  const targetProgress = safeDivide(queue.stats.done, queue.event.targetUnits);

  return {
    checkInRate: safeDivide(checkedInTotal, totalAppointments),
    attendanceRate: safeDivide(attendanceTotal, totalAppointments),
    averageWaitMinutes,
    throughputPerHour,
    targetProgress,
    waitingCount: queue.stats.waiting,
    screeningCount: queue.stats.screening,
    donorCount: queue.stats.donor,
    doneCount: queue.stats.done,
    totalAppointments,
    timestamp: new Date().toISOString(),
  };
}
