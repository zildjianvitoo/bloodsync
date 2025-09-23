"use client";

import { useEffect, useState } from "react";
import { initializeRealtime } from "@/lib/realtime/client";
import {
  type InAppNotification,
  subscribeNotifications,
} from "@/lib/realtime/in-app";

export function RealtimeBridge() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    initializeRealtime();
    const timeouts = new Set<number>();

    const unsubscribe = subscribeNotifications((notification) => {
      setNotifications((prev) => {
        const next = [notification, ...prev];
        return next.slice(0, 3);
      });

      const timeout = window.setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== notification.id));
        }, 3500);
      timeouts.add(timeout);
    });

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      unsubscribe();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center md:top-20">
      <div className="mx-4 flex w-full max-w-xl flex-col gap-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="pointer-events-auto rounded-md border border-zinc-200 bg-white/95 px-4 py-3 text-sm shadow-xl shadow-zinc-900/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90"
          >
            {notification.title ? (
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                {notification.title}
              </div>
            ) : null}
            <div className="text-zinc-700 dark:text-zinc-200">
              {notification.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
