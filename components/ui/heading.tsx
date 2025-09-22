import { cn } from "@/lib/utils";

export function AnimatedHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        "relative overflow-hidden",
        "after:absolute after:inset-y-0 after:-left-8 after:w-64 after:bg-gradient-to-r after:from-primary/10 after:via-primary/5 after:to-transparent after:blur-3xl after:content-['']",
        className
      )}
    >
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-base text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
