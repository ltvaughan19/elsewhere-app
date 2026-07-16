import Link from "next/link";
import { requireStaffSession } from "@/lib/auth/staff";
import { StatusBadge } from "./_components/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaffSession();

  return (
    <div className="min-h-screen bg-void">
      <div className="border-b border-sand-200 bg-void-elevated">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin" className="font-display text-2xl text-cream">
              Elsewhere editorial
            </Link>
            <StatusBadge value="preview" label="Internal workspace" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full border border-sand-200 px-3 py-1.5 capitalize">
              {session.role}
            </span>
            <StatusBadge
              value={session.aal === "aal2" ? "verified" : "changes_requested"}
              label={session.aal === "aal2" ? "MFA active" : "MFA needed to publish"}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="border-b border-sand-200 bg-void-elevated px-4 py-3 lg:min-h-[calc(100vh-73px)] lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
          <nav aria-label="Editorial navigation" className="flex gap-2 overflow-x-auto lg:flex-col">
            <Link
              href="/admin"
              className="min-h-11 shrink-0 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-void-card hover:text-cream"
            >
              Overview
            </Link>
            <Link
              href="/admin/content"
              className="min-h-11 shrink-0 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-void-card hover:text-cream"
            >
              Country publishing
            </Link>
            <Link
              href="/trust"
              className="min-h-11 shrink-0 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-void-card hover:text-cream"
            >
              Public trust page
            </Link>
            <Link
              href="/countries"
              className="min-h-11 shrink-0 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-void-card hover:text-cream"
            >
              Public countries
            </Link>
          </nav>

          <div className="mt-6 hidden rounded-2xl border border-sand-200 p-4 text-xs text-soft lg:block">
            <p className="font-medium text-muted">Publishing rule</p>
            <p className="mt-2">
              Drafts are private. Only an exact, reviewed release can become public, and publication
              requires publisher access plus MFA.
            </p>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
