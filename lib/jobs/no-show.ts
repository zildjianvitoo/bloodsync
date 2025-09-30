import { markNoShowAppointments } from "@/lib/db/appointments";

const globalForNoShow = globalThis as unknown as {
  noShowTimer?: NodeJS.Timeout;
  noShowRunning?: boolean;
};

const DEFAULT_SWEEP_INTERVAL_SECONDS = Number(process.env.NO_SHOW_SWEEP_SECONDS ?? 60);

async function sweepNoShows() {
  if (globalForNoShow.noShowRunning) return;
  globalForNoShow.noShowRunning = true;
  try {
    await markNoShowAppointments();
  } catch (error) {
    console.error("no-show sweep failed", error);
  } finally {
    globalForNoShow.noShowRunning = false;
  }
}

export function registerNoShowSweep() {
  if (globalForNoShow.noShowTimer) return;
  if (DEFAULT_SWEEP_INTERVAL_SECONDS <= 0) return;

  void sweepNoShows();
  globalForNoShow.noShowTimer = setInterval(() => {
    void sweepNoShows();
  }, DEFAULT_SWEEP_INTERVAL_SECONDS * 1000);
}
