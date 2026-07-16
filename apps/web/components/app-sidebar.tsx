"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type NavIcon =
  | "dashboard"
  | "route"
  | "plan"
  | "passport"
  | "budget"
  | "saved"
  | "countries"
  | "compare"
  | "compass"
  | "pricing"
  | "trust"
  | "settings";

type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

const moveNav: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/app/path", label: "My path", icon: "route" },
  { href: "/app/my-plan", label: "My plan", icon: "plan" },
  { href: "/app/passport", label: "Passport", icon: "passport" },
  { href: "/app/budget", label: "Budget", icon: "budget" },
  { href: "/app/saved", label: "Saved", icon: "saved" },
];

const exploreNav: NavItem[] = [
  { href: "/countries", label: "Countries", icon: "countries" },
  { href: "/compare", label: "Compare", icon: "compare" },
  { href: "/visa-compass", label: "Visa Compass", icon: "compass" },
  { href: "/pricing", label: "Pricing", icon: "pricing" },
  { href: "/trust", label: "Trust & sources", icon: "trust" },
];

const accountNav: NavItem[] = [
  { href: "/app/settings", label: "Settings", icon: "settings" },
];

const allNav = [...moveNav, ...exploreNav, ...accountNav];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavGlyph({ icon }: { icon: NavIcon }) {
  const paths: Record<NavIcon, React.ReactNode> = {
    dashboard: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    route: <path d="M5 19c4 0 3-6 7-6s3-8 7-8M5 19l3-1M5 19l1-3M19 5l-3 1M19 5l-1 3" />,
    plan: <path d="M6 3h9l3 3v15H6zM15 3v4h4M9 11h6M9 15h6" />,
    passport: <path d="M6 3h12v18H6zM9 3v18M12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM9 11h6" />,
    budget: <path d="M4 7h16v12H4zM4 10h16M15 15h2" />,
    saved: <path d="M7 4h10v17l-5-3-5 3z" />,
    countries: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />,
    compare: <path d="M8 5h11M16 2l3 3-3 3M16 19H5M8 16l-3 3 3 3" />,
    compass: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z" />,
    pricing: <path d="M5 6h14v12H5zM8 9h8M8 13h5" />,
    trust: <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6zM9 12l2 2 4-5" />,
    settings: <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 12l2-1-2-4-2 .5-1.5-1L15 4h-6l-.5 2.5-1.5 1L5 7l-2 4 2 1v2l-2 1 2 4 2-.5 1.5 1L9 22h6l.5-2.5 1.5-1 2 .5 2-4-2-1z" />,
  };

  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.55"
    >
      {paths[icon]}
    </svg>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  onNavigate,
  connected = false,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
  connected?: boolean;
}) {
  return (
    <div className={connected ? "relative pl-3" : ""}>
      {connected ? (
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-0 top-7 w-px bg-gradient-to-b from-accent-sand/60 via-sand-300 to-transparent"
        />
      ) : null}
      <p className="px-3 pb-2 pt-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-soft">
        {label}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={
                active
                  ? "group flex min-h-11 items-center gap-3 rounded-lg border border-accent-sand/20 bg-accent-sand/15 px-3 text-sm font-medium text-accent-sand"
                  : "group flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 text-sm text-muted transition-colors duration-150 hover:border-sand-200 hover:bg-void-card hover:text-cream"
              }
            >
              <span
                className={
                  active
                    ? "text-accent-sand"
                    : "text-soft transition-colors duration-150 group-hover:text-accent-cool"
                }
              >
                <NavGlyph icon={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SidebarContents({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav aria-label="Elsewhere app navigation" className="space-y-6">
        <NavGroup
          label="Your move"
          items={moveNav}
          pathname={pathname}
          onNavigate={onNavigate}
          connected
        />
        <NavGroup
          label="Explore Elsewhere"
          items={exploreNav}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavGroup
          label="Account"
          items={accountNav}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>
      <div className="mt-8 border-t border-sand-200 px-3 pt-5">
        <p className="text-xs leading-5 text-soft">
          Research is dated and source-backed. High-risk guidance stays unpublished until review.
        </p>
        <Link
          href="/"
          onClick={onNavigate}
          className="mt-3 inline-flex min-h-11 items-center text-xs font-medium text-accent-cool transition-colors duration-150 hover:text-cream"
        >
          Return to Elsewhere home <span aria-hidden="true" className="ml-2">↗</span>
        </Link>
      </div>
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname() ?? "/app/dashboard";
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = allNav.find((item) => isActive(pathname, item.href));

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-sand-200 bg-void-elevated md:flex">
        <div className="flex items-start justify-between gap-3 px-5 pb-5 pt-6">
          <div>
            <Link href="/" className="font-display text-2xl tracking-wide text-cream">
              Elsewhere
            </Link>
            <p className="mt-1 text-xs text-muted">Your move, connected</p>
          </div>
          <ThemeToggle className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-sand-200 text-muted transition-colors duration-150 hover:bg-void-card hover:text-cream" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
          <SidebarContents pathname={pathname} />
        </div>
      </aside>

      <header className="sticky top-0 z-50 flex min-h-16 items-center justify-between gap-3 border-b border-sand-200 bg-void-elevated/95 px-4 backdrop-blur-md md:hidden">
        <div className="min-w-0">
          <Link href="/" className="font-display text-xl tracking-wide text-cream">
            Elsewhere
          </Link>
          <p className="truncate text-[0.68rem] uppercase tracking-[0.14em] text-soft">
            {current?.label ?? "Your move"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-sand-200 text-muted" />
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="app-mobile-navigation"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-sand-200 px-3 text-sm font-medium text-cream transition-colors duration-150 hover:bg-void-card"
          >
            <span>Menu</span>
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              {mobileOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-[var(--ea-overlay)] backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            id="app-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Elsewhere navigation"
            className="absolute inset-y-0 left-0 flex w-[min(22rem,calc(100vw-2rem))] flex-col border-r border-sand-200 bg-void-elevated shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-sand-200 px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
              <div>
                <p className="font-display text-2xl text-cream">Elsewhere</p>
                <p className="mt-1 text-xs text-muted">Plan and explore in one place</p>
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-sand-200 text-muted"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
              <SidebarContents pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}

      <nav
        aria-label="Quick app navigation"
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-sand-200 bg-void-elevated/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md md:hidden"
      >
        {[
          { href: "/app/dashboard", label: "Plan", icon: "dashboard" as const },
          { href: "/countries", label: "Explore", icon: "countries" as const },
          { href: "/app/saved", label: "Saved", icon: "saved" as const },
          { href: "/app/settings", label: "Account", icon: "settings" as const },
        ].map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "flex min-h-14 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium text-accent-sand"
                  : "flex min-h-14 flex-col items-center justify-center gap-1 text-[0.68rem] text-soft"
              }
            >
              <NavGlyph icon={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
