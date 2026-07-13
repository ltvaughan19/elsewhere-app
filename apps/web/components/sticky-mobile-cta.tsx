"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StickyMobileCta() {
  const pathname = usePathname();
  if (pathname === "/" || pathname?.startsWith("/signup")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-sand-200 bg-ivory-50/95 p-3 backdrop-blur-md md:hidden">
      <Link
        href="/signup"
        className="block w-full rounded-full bg-jungle-600 py-3 text-center text-sm font-medium text-white"
      >
        Build My Expat Plan
      </Link>
    </div>
  );
}
