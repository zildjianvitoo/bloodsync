"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  passcode: z.string().min(4, "Passcode must be at least 4 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({
  role,
  className,
}: {
  role: "admin" | "volunteer";
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { passcode: "" },
  });

  function handleSubmit(values: LoginValues) {
    setServerError(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, passcode: values.passcode }),
      });

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({ error: "Login failed" }));
        setServerError(data.error ?? "Login failed");
        return;
      }

      router.replace(role === "admin" ? "/admin" : "/volunteer");
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn(
          "flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-border/70 bg-card/90 p-6 shadow-xl",
          className
        )}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {role === "admin" ? "Admin" : "Volunteer"} Login
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the secure passcode to access the {role} console.
          </p>
        </div>

        <FormField
          control={form.control}
          name="passcode"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Passcode
              </FormLabel>
              <FormControl>
                <input
                  type="password"
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provided by the operations lead on event day.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError ? (
          <p className="text-sm text-destructive">{serverError}</p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
