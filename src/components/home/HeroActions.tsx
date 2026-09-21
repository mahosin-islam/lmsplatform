"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function dashboardHref(role?: string): string {
  return role === "ADMIN" ? "/admin/dashboard" : "/learner/dashboard";
}

export function HeroActions() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return (
      <>
        <Link
          href={dashboardHref(user.role)}
          className={buttonVariants({ variant: "default", size: "lg" })}
        >
          Go to Dashboard
        </Link>
        <Link
          href="/courses"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Browse Courses
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/register"
        className={buttonVariants({ variant: "default", size: "lg" })}
      >
        Get Started
      </Link>
      <Link
        href="/courses"
        className={buttonVariants({ variant: "outline", size: "lg" })}
      >
        Browse Courses
      </Link>
    </>
  );
}