import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-secondary/30 blur-3xl"
      />

      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-xl font-semibold"
      >
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </span>
        LMS Platform
      </Link>

      <main className="relative z-10 flex w-full justify-center">
        {children}
      </main>
    </div>
  );
}