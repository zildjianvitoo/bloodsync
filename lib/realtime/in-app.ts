export type InAppNotification = {
  id: string;
  title?: string;
  message: string;
  level?: "info" | "success" | "warning" | "error";
  createdAt: Date;
};

type NotificationListener = (notification: InAppNotification) => void;

const listeners = new Set<NotificationListener>();

export function subscribeNotifications(listener: NotificationListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pushInAppNotification(input: Omit<InAppNotification, "id" | "createdAt">) {
  const notification: InAppNotification = {
    id: Math.random().toString(36).slice(2),
    createdAt: new Date(),
    level: "info",
    ...input,
  };

  for (const listener of listeners) {
    listener(notification);
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("notification", notification);
  }

  return notification;
}
