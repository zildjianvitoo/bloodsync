export type TelemetryLevel = "info" | "warn" | "error";

export type TelemetryEvent = {
  name: string;
  level?: TelemetryLevel;
  actorRole?: "donor" | "volunteer" | "organizer" | "system";
  context?: Record<string, unknown>;
  timestamp?: Date;
};

export type TelemetryListener = (event: Required<Omit<TelemetryEvent, "context">> & {
  context: Record<string, unknown>;
}) => void | Promise<void>;

const listeners = new Set<TelemetryListener>();

export function addTelemetryListener(listener: TelemetryListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function emitTelemetry(event: TelemetryEvent) {
  const payload = {
    level: event.level ?? "info",
    timestamp: event.timestamp ?? new Date(),
    name: event.name,
    actorRole: event.actorRole ?? "system",
    context: event.context ?? {},
  } as const;

  for (const listener of listeners) {
    await listener(payload);
  }
}

addTelemetryListener(async (event) => {
  const serialized = JSON.stringify({
    name: event.name,
    actorRole: event.actorRole,
    level: event.level,
    timestamp: event.timestamp.toISOString(),
    context: event.context,
  });

  if (event.level === "error") {
    console.error("telemetry", serialized);
    return;
  }

  if (event.level === "warn") {
    console.warn("telemetry", serialized);
    return;
  }

  console.log("telemetry", serialized);
});
