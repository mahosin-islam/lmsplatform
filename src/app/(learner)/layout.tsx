"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  Bell,
  BookOpen,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  User as UserIcon,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { UnreadCountData } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/learner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/learner/courses", label: "My Courses", icon: BookOpen },
  { href: "/learner/live-sessions", label: "Support Sessions", icon: Headphones },
  { href: "/learner/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/learner/certificates", label: "Certificates", icon: Award },
  { href: "/learner/payments", label: "Payments", icon: CreditCard },
  { href: "/learner/notifications", label: "Notifications", icon: Bell },
];

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "A";
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageTitle(pathname: string): string {
  const match = NAV_ITEMS.find((item) => isActive(pathname, item.href));
  return match?.label ?? "My Learning";
}

function useUnreadCount(userId?: string): number {
  const unreadQuery = useQuery({
    queryKey: ["unread-count", userId],
    enabled: Boolean(userId),
    refetchInterval: 30_000,
    queryFn: async () =>
      (
        await apiFetch<UnreadCountData>(
          `/notifications/unread-count/${userId}`
        )
      ).data,
  });

  return unreadQuery.data?.unreadCount ?? 0;
}

function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate}>
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
          <GraduationCap className="size-5" />
        </span>
        <span className="text-base font-semibold tracking-tight">
          My Learning
        </span>
      </div>
    </Link>
  );
}

function SidebarNav({
  pathname,
  onNavigate,
  unreadCount,
}: {
  pathname: string;
  onNavigate?: () => void;
  unreadCount: number;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        const isNotifications = item.href === "/learner/notifications";
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 border-l-4 px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {isNotifications && unreadCount > 0 ? (
              <span className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  pathname,
  name,
  email,
  avatar,
  onLogout,
  onNavigate,
}: {
  pathname: string;
  name: string;
  email: string;
  avatar?: string | null;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const profileActive = isActive(pathname, "/learner/profile");
  return (
    <div className="border-t border-slate-200 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <Avatar className="size-9">
          {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
          <AvatarFallback className="bg-indigo-50 text-sm text-indigo-600">
            {getUserInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{name}</p>
          <p className="truncate text-xs text-slate-500">{email}</p>
        </div>
      </div>
      <div className="mt-1 space-y-1">
        <Link
          href="/learner/profile"
          onClick={onNavigate}
          aria-current={profileActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 border-l-4 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            profileActive
              ? "border-primary bg-primary/10 font-semibold text-primary"
              : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <UserIcon className="size-4" />
          Profile
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const unreadCount = useUnreadCount(user?.id);

  React.useEffect(() => {
    if (!loading && (!user || user.role !== "LEARNER")) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const handleLogout = React.useCallback(() => {
    logout();
    toast.success("Logged out");
  }, [logout]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user || user.role !== "LEARNER") {
    return null;
  }

  const title = pageTitle(pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200 bg-gradient-to-b from-indigo-50/70 to-white md:flex">
        <SidebarBrand />
        <SidebarNav pathname={pathname} unreadCount={unreadCount} />
        <SidebarFooter
          pathname={pathname}
          name={user.name}
          email={user.email}
          avatar={user.avatar}
          onLogout={handleLogout}
        />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Open menu" />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex flex-col bg-gradient-to-b from-indigo-50/70 to-white p-0"
          >
            <SheetTitle className="sr-only">Learner navigation</SheetTitle>
            <SidebarBrand onNavigate={() => setMobileOpen(false)} />
            <SidebarNav
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              unreadCount={unreadCount}
            />
            <SidebarFooter
              pathname={pathname}
              name={user.name}
              email={user.email}
              avatar={user.avatar}
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <span className="flex-1 truncate text-sm font-semibold">{title}</span>

        <Avatar className="size-8">
          {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
          <AvatarFallback className="bg-indigo-50 text-xs text-indigo-600">
            {getUserInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </header>

      <main className="md:ml-60">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}