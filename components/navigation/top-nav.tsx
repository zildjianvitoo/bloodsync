"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Overview" },
];

const volunteerLinks = [
  { href: "/volunteer", label: "Stations" },
];

export function TopNav({ role }: { role: "admin" | "volunteer" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const links = role === "admin" ? adminLinks : volunteerLinks;

  function signOut() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace(role === "admin" ? "/admin/login" : "/volunteer/login");
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            BloodSync
          </span>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition-colors",
                    active ? "text-foreground" : "hover:text-foreground/80"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
            {role === "admin" ? "Admin" : "Volunteer"} console
          </span>
          <Button variant="outline" size="sm" onClick={signOut} disabled={pending}>
            {pending ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </div>
    </header>
  );
}
