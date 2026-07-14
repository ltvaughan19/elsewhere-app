"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StickyMobileCta() {
  const pathname = usePathname();
  if (
    pathname === "/" ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/app")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-sand-200 bg-void/95 p-3 backdrop-blur-md md:hidden">
      <Link
        href="/app/onboarding"
        className="block w-full rounded-md bg-accent-sand py-3 text-center text-sm font-medium text-accent-ink"
      >
        Start Fit Quiz
      </Link>
    </div>
  );
}
