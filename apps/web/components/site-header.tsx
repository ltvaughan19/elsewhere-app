import Link from "next/link";

const links = [
  { href: "/countries", label: "Countries" },
  { href: "/compare", label: "Compare" },
  { href: "/visa-compass", label: "Visa Compass" },
  { href: "/pricing", label: "Pricing" },
  { href: "/trust", label: "Trust" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-sand-200/80 bg-ivory-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-2xl text-navy-950">
          Expat Atlas
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-navy-800 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-jungle-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm text-navy-800 sm:inline"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-jungle-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-jungle-500"
          >
            Build My Expat Plan
          </Link>
        </div>
      </div>
    </header>
  );
}
