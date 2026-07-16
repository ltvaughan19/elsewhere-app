"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const planLinks = [
  { href: "/app/dashboard", label: "Overview", shortLabel: "Plan" },
  { href: "/app/path", label: "Path", shortLabel: "Path" },
  { href: "/app/my-plan", label: "Tasks", shortLabel: "Tasks" },
  { href: "/app/passport", label: "Passport", shortLabel: "Passport" },
  { href: "/app/budget", label: "Budget", shortLabel: "Budget" },
];

const mobileLinks = [
  { href: "/app/dashboard", label: "Plan" },
  { href: "/countries", label: "Explore" },
  { href: "/app/saved", label: "Saved" },
  { href: "/app/settings", label: "Account" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileGlyph({ label }: { label: string }) {
  const paths: Record<string, React.ReactNode> = {
    Plan: <path d="M5 5h14v14H5zM8 9h8M8 13h5" />,
    Explore: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z" />,
    Saved: <path d="M7 4h10v17l-5-3-5 3z" />,
    Account: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-5 15-5 16 0" />,
  };
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.55">
      {paths[label]}
    </svg>
  );
}

export function AppSidebar() {
  const pathname = usePathname() ?? "/app/dashboard";
  const isOnboarding = pathname === "/app/onboarding";

  return (
    <>
      {isOnboarding ? (
        <div className="border-b border-sand-200 bg-void-elevated/55">
          <div className="mx-auto flex min-h-12 max-w-6xl items-center justify-between px-5 text-sm sm:px-6">
            <span className="text-muted">Plan setup</span>
            <Link href="/countries" className="inline-flex min-h-11 items-center text-accent-cool hover:text-cream">
              Exit to country research
            </Link>
          </div>
        </div>
      ) : (
        <nav aria-label="Plan sections" className="hidden border-b border-sand-200 bg-void-elevated/55 md:block">
          <div className="mx-auto flex max-w-6xl items-center gap-1 px-6">
            <p className="mr-5 text-xs font-medium uppercase tracking-[0.16em] text-soft">Your plan</p>
            {planLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "inline-flex min-h-12 items-center border-b border-accent-sand px-4 text-sm font-medium text-cream"
                      : "inline-flex min-h-12 items-center border-b border-transparent px-4 text-sm text-muted transition-colors duration-150 hover:text-cream"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {!isOnboarding ? (
        <nav
          aria-label="Quick app navigation"
          className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-sand-200 bg-void-elevated/97 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md md:hidden"
        >
          {mobileLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex min-h-14 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-accent-sand"
                    : "flex min-h-14 flex-col items-center justify-center gap-1 text-[0.7rem] text-soft"
                }
              >
                <MobileGlyph label={link.label} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
