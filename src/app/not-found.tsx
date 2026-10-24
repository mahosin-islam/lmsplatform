import Link from "next/link";
import { Compass, Home } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass className="size-8" />
      </span>
      <p className="mt-6 text-sm font-semibold tracking-widest text-primary uppercase">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        The page you are looking for does not exist, was moved, or the link is
        broken.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 px-5")}
        >
          <Home className="size-4" />
          Back home
        </Link>
        <Link
          href="/courses"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 gap-2 px-5"
          )}
        >
          Browse courses
        </Link>
      </div>
    </div>
  );
}
