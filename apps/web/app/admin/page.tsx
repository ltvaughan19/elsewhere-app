import Link from "next/link";
import { requireStaffSession } from "@/lib/auth/staff";
import {
  AdminCard,
  AdminSectionHeading,
  EmptyState,
  primaryButtonClass,
  StatusBadge,
} from "./_components/admin-ui";

export default async function AdminDashboardPage() {
  const { supabase, role, aal } = await requireStaffSession();

  const [sourceResult, claimResult, blockResult, releaseResult, reportResult] =
    await Promise.all([
      supabase
        .from("source_documents")
        .select("*", { count: "exact", head: true })
        .eq("state", "draft"),
      supabase
        .from("claim_versions")
        .select("*", { count: "exact", head: true })
        .in("workflow_state", ["draft", "in_review", "changes_requested"]),
      supabase
        .from("content_block_versions")
        .select("*", { count: "exact", head: true })
        .in("workflow_state", ["draft", "in_review", "changes_requested"]),
      supabase
        .from("country_releases")
        .select("*", { count: "exact", head: true })
        .in("state", ["draft", "ready"]),
      supabase
        .from("outdated_information_reports")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "triaged", "investigating"]),
    ]);

  const results = [sourceResult, claimResult, blockResult, releaseResult, reportResult];
  const databaseReady = results.every((result) => !result.error);
  const metrics = [
    { label: "Sources awaiting work", value: sourceResult.count ?? 0 },
    { label: "Claim drafts", value: claimResult.count ?? 0 },
    { label: "Content drafts", value: blockResult.count ?? 0 },
    { label: "Open releases", value: releaseResult.count ?? 0 },
    { label: "Outdated-info reports", value: reportResult.count ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="elsewhere-eyebrow">Trust operations</p>
          <h1 className="mt-2 font-display text-4xl text-cream">Editorial overview</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Build evidence first, review exact versions second, and publish an immutable country
            release only when every gate passes.
          </p>
        </div>
        <Link href="/admin/content" className={primaryButtonClass}>
          Open country publishing
        </Link>
      </div>

      {!databaseReady ? (
        <EmptyState
          title="Editorial database setup is not available in this environment"
          description="The screens are ready, but the publishing migrations must be applied and your account must have an active staff membership before live editorial records can be loaded."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <AdminCard key={metric.label} className="p-4 md:p-4">
              <p className="font-mono text-3xl text-cream">{metric.value}</p>
              <p className="mt-1 text-xs text-muted">{metric.label}</p>
            </AdminCard>
          ))}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminCard>
          <AdminSectionHeading
            eyebrow="Your access"
            title="Permission boundary"
            description="Every screen and every server action checks your current signed-in identity and database staff membership."
          />
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-sand-200 bg-void-elevated p-4">
              <dt className="text-xs uppercase tracking-wider text-soft">Role</dt>
              <dd className="mt-2 flex items-center gap-2 capitalize text-cream">
                {role}
                <StatusBadge value="verified" label="Active" />
              </dd>
            </div>
            <div className="rounded-xl border border-sand-200 bg-void-elevated p-4">
              <dt className="text-xs uppercase tracking-wider text-soft">Authentication</dt>
              <dd className="mt-2">
                <StatusBadge
                  value={aal === "aal2" ? "verified" : "changes_requested"}
                  label={aal === "aal2" ? "MFA active" : "Single factor"}
                />
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-soft">
            Editors draft. Reviewers create permanent review events. Publishers with MFA can make a
            reviewed release public. No admin action uses a service-role key.
          </p>
        </AdminCard>

        <AdminCard>
          <AdminSectionHeading
            eyebrow="Workflow"
            title="The safe publishing path"
            description="A release is a frozen set of claim versions and content-block versions, not a live view of whatever was edited most recently."
          />
          <ol className="mt-5 space-y-3 text-sm text-muted">
            {[
              "Register the canonical source and capture an exact evidence fingerprint.",
              "Draft one narrow claim with a primary citation to that evidence.",
              "Write user-facing content that points back to approved claims.",
              "Compose a country release from exact versions and complete release QA.",
              "Publish with a publisher account and MFA; preserve prior history.",
            ].map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sand-300 text-xs text-accent-sand">
                  {index + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </AdminCard>
      </div>
    </div>
  );
}
