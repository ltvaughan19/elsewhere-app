import Link from "next/link";
import { TrustDisclaimer } from "@expat-atlas/ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-sand-200 bg-[var(--color-void-elevated)] text-navy-950">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl">Elsewhere</p>
            <p className="mt-2 text-sm text-navy-800">One calm path abroad.</p>
          </div>
          <div className="text-sm text-navy-800">
            <p className="mb-2 font-medium text-navy-950">Explore</p>
            <ul className="space-y-1">
              <li>
                <Link href="/countries" className="hover:text-ocean-400">
                  Countries
                </Link>
              </li>
              <li>
                <Link href="/passport-checklist" className="hover:text-ocean-400">
                  Passport checklist
                </Link>
              </li>
              <li>
                <Link href="/budget-calculator" className="hover:text-ocean-400">
                  Budget calculator
                </Link>
              </li>
              <li>
                <Link href="/corridors" className="hover:text-ocean-400">
                  Launch corridors
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-ocean-400">
                  Compare countries
                </Link>
              </li>
              <li>
                <Link href="/visa-compass" className="hover:text-ocean-400">
                  Visa Compass
                </Link>
              </li>
              <li>
                <Link href="/housing" className="hover:text-ocean-400">
                  Housing strategy
                </Link>
              </li>
              <li>
                <Link href="/insurance" className="hover:text-ocean-400">
                  Insurance guide
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-sm text-navy-800">
            <p className="mb-2 font-medium text-navy-950">Trust</p>
            <ul className="space-y-1">
              <li>
                <Link href="/trust" className="hover:text-ocean-400">
                  How we source information
                </Link>
              </li>
              <li>
                <Link href="/partners" className="hover:text-ocean-400">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-ocean-400">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-ocean-400">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-ocean-400">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-sand-200 pt-6">
          <TrustDisclaimer />
        </div>
      </div>
    </footer>
  );
}
