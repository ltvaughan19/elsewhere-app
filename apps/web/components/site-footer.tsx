import Link from "next/link";
import { TrustDisclaimer } from "@expat-atlas/ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-sand-200 bg-navy-950 text-ivory-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl">Expat Atlas</p>
            <p className="mt-2 text-sm text-ivory-50/70">
              A calmer way to plan your move abroad.
            </p>
          </div>
          <div className="text-sm text-ivory-50/80">
            <p className="mb-2 font-medium text-ivory-50">Explore</p>
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
            </ul>
          </div>
          <div className="text-sm text-ivory-50/80">
            <p className="mb-2 font-medium text-ivory-50">Trust</p>
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
        <div className="mt-8 border-t border-ivory-50/10 pt-6">
          <TrustDisclaimer className="text-ivory-50/60" />
        </div>
      </div>
    </footer>
  );
}
