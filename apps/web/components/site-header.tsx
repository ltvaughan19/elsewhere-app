"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const primaryLinks = [
  { href: "/countries", label: "Countries" },
  { href: "/compare", label: "Compare" },
  { href: "/app/dashboard", label: "Plan" },
];

const planLinks = [
  { href: "/app/dashboard", label: "Overview" },
  { href: "/app/path", label: "Path" },
  { href: "/app/my-plan", label: "Tasks" },
  { href: "/app/passport", label: "Passport" },
  { href: "/app/budget", label: "Budget" },
  { href: "/app/saved", label: "Saved" },
];

const researchLinks = [
  { href: "/countries", label: "Countries" },
  { href: "/compare", label: "Compare countries" },
  { href: "/visa-compass", label: "Visa Compass" },
  { href: "/trust", label: "How sources are reviewed" },
];

function isActive(pathname: string, href: string) {
  if (href === "/app/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const inPlanner = pathname.startsWith("/app");
  const inAccountFlow = ["/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname);
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeAtDesktop);
    return () => desktop.removeEventListener("change", closeAtDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const dialog = document.getElementById("elsewhere-mobile-navigation");
        const focusable = dialog?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleDialogKeys);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleDialogKeys);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-sand-200 bg-void/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-7 px-5 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center font-display text-[1.65rem] leading-none text-cream"
            aria-label="Elsewhere home"
          >
            Elsewhere
          </Link>

          <nav aria-label="Primary navigation" className={inAccountFlow ? "hidden" : "hidden items-center gap-1 md:flex"}>
            {primaryLinks.map((link) => {
              const active =
                link.href === "/app/dashboard"
                  ? inPlanner
                  : isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "inline-flex min-h-11 items-center border-b border-accent-sand px-4 text-sm font-medium text-cream"
                      : "inline-flex min-h-11 items-center border-b border-transparent px-4 text-sm text-muted transition-colors duration-150 hover:text-cream"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-sand-200 text-muted transition-colors duration-150 hover:bg-void-elevated hover:text-cream" />
            <Link
              href={inPlanner ? "/app/settings" : inAccountFlow && pathname === "/login" ? "/signup" : "/login"}
              className="hidden min-h-11 items-center px-3 text-sm text-muted transition-colors duration-150 hover:text-cream sm:inline-flex"
            >
              {inPlanner ? "Account" : inAccountFlow && pathname === "/login" ? "Create account" : "Log in"}
            </Link>
            {!inAccountFlow && !inPlanner ? <Link
              href="/app/onboarding"
              className="hidden min-h-11 items-center rounded-md bg-accent-sand px-4 text-sm font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-sand-hover md:inline-flex"
            >
              Start a plan
            </Link> : null}
            {!inAccountFlow ? <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-sand-200 px-3 text-sm font-medium text-cream transition-colors duration-150 hover:bg-void-elevated md:hidden"
              aria-expanded={open}
              aria-controls="elsewhere-mobile-navigation"
              aria-label={open ? "Menu, close navigation" : "Menu, open navigation"}
              onClick={() => setOpen((value) => !value)}
            >
              <span>Menu</span>
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                {open ? (
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button> : null}
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            aria-label="Close navigation backdrop"
            className="absolute inset-0 bg-[var(--ea-overlay)] backdrop-blur-sm"
            onClick={closeMenu}
          />
          <aside
            id="elsewhere-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Elsewhere navigation"
            className="absolute inset-y-0 right-0 flex w-[min(24rem,calc(100vw-1.5rem))] flex-col border-l border-sand-200 bg-void-elevated shadow-2xl"
          >
            <div className="flex min-h-16 items-center justify-between border-b border-sand-200 px-5 pt-[env(safe-area-inset-top)]">
              <p className="font-display text-2xl text-cream">Elsewhere</p>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close navigation"
                onClick={() => {
                  closeMenu();
                  menuButtonRef.current?.focus();
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-sand-200 text-muted"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-5 py-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
              {inPlanner ? (
                <div>
                  <p className="elsewhere-eyebrow">Your plan</p>
                  <ul className="mt-3 border-t border-sand-200">
                    {planLinks.map((link) => (
                      <li key={link.href} className="border-b border-sand-200">
                        <Link
                          href={link.href}
                          onClick={closeMenu}
                          aria-current={isActive(pathname, link.href) ? "page" : undefined}
                          className="flex min-h-12 items-center justify-between text-base text-cream"
                        >
                          {link.label}
                          <span aria-hidden="true" className="text-soft">&rarr;</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className={inPlanner ? "mt-8" : ""}>
                <p className="elsewhere-eyebrow">Research</p>
                <ul className="mt-3 border-t border-sand-200">
                  {researchLinks.map((link) => (
                    <li key={link.href} className="border-b border-sand-200">
                      <Link
                        href={link.href}
                        onClick={closeMenu}
                        aria-current={isActive(pathname, link.href) ? "page" : undefined}
                        className="flex min-h-12 items-center justify-between text-base text-cream"
                      >
                        {link.label}
                        <span aria-hidden="true" className="text-soft">&rarr;</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 border-t border-sand-200 pt-5">
                <Link
                  href={inPlanner ? "/app/settings" : "/login"}
                  onClick={closeMenu}
                  className="flex min-h-12 items-center justify-between text-base text-cream"
                >
                  {inPlanner ? "Settings" : "Log in"}
                  <span aria-hidden="true" className="text-soft">&rarr;</span>
                </Link>
                {!inPlanner ? (
                  <Link
                    href="/app/onboarding"
                    onClick={closeMenu}
                    className="mt-4 flex min-h-12 items-center justify-center rounded-md bg-accent-sand px-5 text-sm font-medium text-accent-ink"
                  >
                    Start a plan
                  </Link>
                ) : null}
              </div>
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
