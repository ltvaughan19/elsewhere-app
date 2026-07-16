import Link from "next/link";
import { TrustDisclaimer } from "@expat-atlas/ui";

const footerLinks = [
  { href: "/countries", label: "Countries" },
  { href: "/compare", label: "Compare" },
  { href: "/visa-compass", label: "Visa Compass" },
  { href: "/trust", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-sand-200 bg-void-elevated text-cream">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-7 border-b border-sand-200 pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-2xl">Elsewhere</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Source-aware research and a practical plan for the whole move.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <ul className="flex max-w-2xl flex-wrap gap-x-6 gap-y-1">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 min-w-11 items-center text-sm text-muted transition-colors duration-150 hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="pt-6">
          <TrustDisclaimer className="max-w-4xl text-xs leading-5 text-soft" />
        </div>
      </div>
    </footer>
  );
}
