"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/countries", label: "Countries" },
  { href: "/compare", label: "Compare" },
  { href: "/visa-compass", label: "Visa Compass" },
  { href: "/pricing", label: "Pricing" },
  { href: "/trust", label: "Trust" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200 bg-void/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="font-display text-2xl text-cream">
          Elsewhere
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-navy-800 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "font-medium text-cream"
                  : "transition hover:text-cream"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/app/dashboard"
            className="hidden text-sm text-navy-800 transition hover:text-cream sm:inline"
          >
            Dashboard
          </Link>
          <Link
            href="/login"
            className="hidden text-sm text-navy-800 transition hover:text-cream sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/app/onboarding"
            className="hidden rounded-md bg-accent-sand px-3.5 py-2 text-sm font-medium text-accent-ink transition hover:bg-accent-sand-hover sm:inline"
          >
            Start Fit Quiz
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-sand-200 text-cream md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-sand-200 bg-void-elevated px-6 py-4 md:hidden">
          <ul className="space-y-3 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    pathname === link.href
                      ? "font-medium text-accent-sand"
                      : "text-navy-800"
                  }
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-sand-200 pt-3">
              <Link href="/app/dashboard" className="text-navy-800" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-navy-800" onClick={() => setOpen(false)}>
                Log in
              </Link>
            </li>
            <li>
              <Link
                href="/app/onboarding"
                className="inline-block rounded-md bg-accent-sand px-4 py-2 font-medium text-accent-ink"
                onClick={() => setOpen(false)}
              >
                Start Fit Quiz
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
