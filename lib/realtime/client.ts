"use client";

import { io, type Socket } from "socket.io-client";
import { emitTelemetry } from "@/lib/telemetry";
import { pushInAppNotification } from "@/lib/realtime/in-app";

type QueueNotification = {
  title?: string;
  message: string;
  level?: "info" | "success" | "warning" | "error";
};

let socket: Socket | undefined;

function getSocketHost() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return process.env.NEXT_PUBLIC_SOCKET_HOST_URL ?? window.location.origin;
}

function ensureSocket() {
  if (socket || typeof window === "undefined") {
    return socket;
  }

  const host = getSocketHost();
  socket = io(host, {
    path: "/api/socket",
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    emitTelemetry({ name: "socket:client_connected" });
  });

  socket.on("disconnect", (reason) => {
    emitTelemetry({ name: "socket:client_disconnected", context: { reason } });
  });

  socket.on("notify", (payload: QueueNotification) => {
    pushInAppNotification({
      title: payload.title,
      message: payload.message,
      level: payload.level,
    });
  });

  return socket;
}

export function initializeRealtime() {
  return ensureSocket();
}

export function emitClientEvent<T = unknown>(event: string, data: T) {
  ensureSocket()?.emit(event, data);
}

export function subscribeRealtime<T = unknown>(event: string, handler: (payload: T) => void) {
  const sock = initializeRealtime();
  sock?.on(event, handler as never);
  return () => sock?.off(event, handler as never);
}
