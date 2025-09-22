import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-6 text-sm shadow-xl",
        "dark:border-white/10 dark:bg-white/5",
        "backdrop-blur-xl",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="relative z-10 text-foreground dark:text-foreground/90">{children}</div>
    </div>
  );
}
