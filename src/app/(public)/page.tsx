import { GraduationCap } from "lucide-react";

import { HeroActions } from "@/components/home/HeroActions";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-8 text-center">
      <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <GraduationCap className="size-8" />
      </div>
      <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
        LMS Platform
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Learning Management System
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <HeroActions />
      </div>
    </div>
  );
}