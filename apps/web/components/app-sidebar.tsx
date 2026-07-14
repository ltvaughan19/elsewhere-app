"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/path", label: "My path" },
  { href: "/app/my-plan", label: "My plan" },
  { href: "/app/passport", label: "Passport" },
  { href: "/app/budget", label: "Budget" },
  { href: "/app/saved", label: "Saved" },
  { href: "/app/settings", label: "Settings" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-sand-200 bg-void-elevated md:w-56 md:border-b-0 md:border-r">
      <div className="px-4 py-5">
        <Link
          href="/"
          className="font-display text-2xl tracking-wide text-cream"
        >
          Elsewhere
        </Link>
        <p className="mt-1 text-xs text-navy-800">Your move plan</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible md:px-3 md:pb-6">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "whitespace-nowrap rounded-lg bg-accent-sand/20 px-3 py-2 text-sm font-medium text-accent-sand"
                  : "whitespace-nowrap rounded-lg px-3 py-2 text-sm text-navy-800 hover:bg-void-card hover:text-cream"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
