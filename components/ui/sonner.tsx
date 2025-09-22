"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className:
          "rounded-2xl border border-border/60 bg-card/90 text-foreground shadow-2xl backdrop-blur",
      }}
    />
  );
}
