"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, LayoutDashboard, LogOut, Menu, User } from "lucide-react";
import { cn } from "cn";

import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

function dashboardHref(role?: string): string {
  return role === "ADMIN" ? "/admin/dashboard" : "/learner/dashboard";
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated, logout } = useAuth();

  const isHome = pathname === "/";
  const isCourses = pathname.startsWith("/courses");

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
  };

  const DesktopNavLinks = (
    <nav className="hidden items-center gap-1 md:flex">
      <Link
        href="/"
        className={cn(
          "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          isHome && "font-semibold text-primary"
        )}
      >
        Home
      </Link>
      <Link
        href="/courses"
        className={cn(
          "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          isCourses && "font-semibold text-primary"
        )}
      >
        Courses
      </Link>
    </nav>
  );

  const MobileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-muted md:hidden"
            aria-label="Open menu"
          >
            <Menu />
          </button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-44">
        <DropdownMenuItem onClick={() => handleNavigate("/")}>
          Home
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigate("/courses")}>
          Courses
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isAuthenticated && user ? (
          <>
            <DropdownMenuItem
              onClick={() => handleNavigate(dashboardHref(user.role))}
            >
              <LayoutDashboard />
              {user.role === "ADMIN" ? "Admin Panel" : "My Dashboard"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut />
              Logout
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => handleNavigate("/login")}>
              <User />
              Login
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate("/register")}>
              Register
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto h-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 text-lg font-bold text-foreground"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="hidden sm:inline">LMS Platform</span>
            <span className="inline sm:hidden">LMS</span>
          </Link>

          {/* Center: Desktop nav links */}
          {DesktopNavLinks}

          {/* Right: Auth area */}
          <div className="flex shrink-0 items-center gap-2">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="hidden size-8 animate-pulse rounded-full bg-muted sm:block" />
                <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : (
              <>
                {isAuthenticated && user ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="hidden md:inline-flex"
                    >
                      <LogOut />
                      Logout
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            className="hidden rounded-full outline-none md:block"
                            aria-label="Account menu"
                          >
                            <Avatar>
                              {user.avatar ? (
                                <AvatarImage src={user.avatar} alt={user.name} />
                              ) : null}
                              <AvatarFallback>
                                {getUserInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                        }
                      />
                      <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="w-56"
                      >
                        <DropdownMenuLabel>
                          <span className="block max-w-44 truncate font-medium text-foreground">
                            {user.name}
                          </span>
                          <span className="block max-w-44 truncate text-xs font-normal text-muted-foreground">
                            {user.email}
                          </span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleNavigate(dashboardHref(user.role))}
                        >
                          <LayoutDashboard />
                          {user.role === "ADMIN" ? "Admin Panel" : "My Dashboard"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={handleLogout}
                        >
                          <LogOut />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="hidden sm:inline-flex"
                      nativeButton={false}
                      render={<Link href="/login" />}
                    >
                      Login
                    </Button>
                    <Button
                      nativeButton={false}
                      render={<Link href="/register" />}
                    >
                      Register
                    </Button>
                  </>
                )}
                {MobileMenu}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}