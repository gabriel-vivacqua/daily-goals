"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/auth";

const LINKS = [
  { href: "/goals", label: "Today's Goals" },
  { href: "/calendar", label: "Calendar" },
  { href: "/people", label: "People" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav({ user }: { user: PublicUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleLogoutAll() {
    if (!window.confirm("Log out every other device signed in as you? This device stays logged in."))
      return;
    setLoggingOutAll(true);
    try {
      await fetch("/api/auth/logout-all", { method: "POST" });
      router.refresh();
    } finally {
      setLoggingOutAll(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/goals" className="headline text-lg sm:text-xl">
            Daily Goals
          </Link>

          <nav className="hidden items-center gap-6 sm:flex">
            {LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`micro-label !text-xs underline-offset-4 transition-colors hover:text-foreground hover:underline ${
                    active ? "text-foreground" : "text-foreground/50"
                  }`}
                >
                  {link.label} <span>↘</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden micro-label sm:inline">{user.name}</span>
            <button
              onClick={handleLogoutAll}
              disabled={loggingOutAll}
              title="Log out every other device signed in as you"
              className="hidden micro-label !text-xs !normal-case !tracking-normal text-foreground/40 transition-colors hover:text-foreground sm:inline disabled:opacity-50"
            >
              {loggingOutAll ? "…" : "Log out other devices"}
            </button>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="micro-label !text-xs rounded-full border border-line px-3 py-1.5 transition-colors hover:border-foreground/40 disabled:opacity-50"
            >
              {loggingOut ? "…" : "Log out"}
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-background/95 backdrop-blur sm:hidden">
        {LINKS.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 py-3 text-center micro-label !text-[10px] ${
                active ? "text-foreground" : "text-foreground/50"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
