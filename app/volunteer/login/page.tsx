import { LoginForm } from "@/components/auth/login-form";

export default function VolunteerLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16">
      <LoginForm role="volunteer" />
    </main>
  );
}
