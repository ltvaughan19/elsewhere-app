"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StickyMobileCta } from "@/components/sticky-mobile-cta";

export function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppShell =
    pathname?.startsWith("/app") || pathname?.startsWith("/admin");
  const isMarketingHome = pathname === "/";

  if (isAppShell || isMarketingHome) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <StickyMobileCta />
      <SiteFooter />
    </>
  );
}
