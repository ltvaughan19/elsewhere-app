import Link from "next/link";
import { requireStaffSession } from "@/lib/auth/staff";
import {
  AdminCard,
  EmptyState,
  primaryButtonClass,
  StatusBadge,
} from "../_components/admin-ui";
import { LAUNCH_COUNTRY_SLUGS } from "./constants";

const COUNTRY_PRESENTATION: Record<string, { flag: string; focus: string }> = {
  philippines: {
    flag: "🇵🇭",
    focus: "Entry, stay paths, housing, healthcare, money, and settling in.",
  },
  thailand: {
    flag: "🇹🇭",
    focus: "Entry, stay paths, work cautions, cities, healthcare, and renewals.",
  },
  mexico: {
    flag: "🇲🇽",
    focus: "Entry, residence paths, money, housing, healthcare, and daily setup.",
  },
};

export default async function CountryPublishingPage() {
  const { supabase } = await requireStaffSession();

  const [countryResult, portalResult, sourceResult, claimResult, blockResult, releaseResult] =
    await Promise.all([
      supabase
        .from("countries")
        .select("id, slug, name, iso_code, region, visibility")
        .in("slug", [...LAUNCH_COUNTRY_SLUGS])
        .order("name"),
      supabase.from("country_portals").select("country_id, coverage_level"),
      supabase.from("source_documents").select("country_id, state"),
      supabase.from("claims").select("country_id, suppressed_at"),
      supabase.from("content_blocks").select("country_id"),
      supabase
        .from("country_releases")
        .select("id, country_id, release_number, state, is_current, published_at, updated_at")
        .order("release_number", { ascending: false }),
    ]);

  const queryResults = [
    countryResult,
    portalResult,
    sourceResult,
    claimResult,
    blockResult,
    releaseResult,
  ];
  const databaseError = queryResults.find((result) => result.error)?.error;

  if (databaseError || !countryResult.data?.length) {
    return (
      <div className="space-y-6">
        <div>
          <p className="elsewhere-eyebrow">Country publishing</p>
          <h1 className="mt-2 font-display text-4xl text-cream">Launch portals</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted">
            Philippines, Thailand, and Mexico share one evidence and release workflow.
          </p>
        </div>
        <EmptyState
          title="The country publishing records are not ready here"
          description="Apply the editorial publishing migrations, seed the three launch portals, and add your signed-in account to staff memberships. Then this page will load the live queues."
        />
      </div>
    );
  }

  const portals = portalResult.data ?? [];
  const sources = sourceResult.data ?? [];
  const claims = claimResult.data ?? [];
  const blocks = blockResult.data ?? [];
  const releases = releaseResult.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <p className="elsewhere-eyebrow">Country publishing</p>
        <h1 className="mt-2 font-display text-4xl text-cream">Launch portals</h1>
        <p className="mt-3 max-w-3xl text-sm text-muted">
          Each portal can grow independently, but every public fact follows the same source,
          snapshot, review, and immutable-release rules.
        </p>
      </div>

      <div className="rounded-2xl border border-accent-cool/30 bg-accent-cool/10 px-4 py-3 text-sm text-accent-cool">
        A country marked “preview” is an editorial work area, not a promise of complete public
        coverage. Publish only the sections that have passed every gate.
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {countryResult.data.map((country) => {
          const presentation = COUNTRY_PRESENTATION[country.slug] ?? {
            flag: "",
            focus: "Source-backed relocation planning.",
          };
          const portal = portals.find((item) => item.country_id === country.id);
          const countrySources = sources.filter((item) => item.country_id === country.id);
          const verifiedSources = countrySources.filter((item) => item.state === "verified").length;
          const countryClaims = claims.filter(
            (item) => item.country_id === country.id && item.suppressed_at === null,
          ).length;
          const countryBlocks = blocks.filter((item) => item.country_id === country.id).length;
          const latestRelease = releases.find((item) => item.country_id === country.id);

          return (
            <AdminCard key={country.id} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-3xl" aria-hidden="true">
                    {presentation.flag}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-cream">{country.name}</h2>
                  <p className="mt-1 text-xs uppercase tracking-wider text-soft">
                    {country.iso_code} · {country.region ?? "Region pending"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge value={country.visibility} />
                  <StatusBadge value={portal?.coverage_level ?? "preview"} label={`${portal?.coverage_level ?? "preview"} coverage`} />
                </div>
              </div>

              <p className="mt-5 text-sm text-muted">{presentation.focus}</p>

              <dl className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-sand-200 bg-void-elevated p-3">
                  <dt className="text-[0.65rem] uppercase tracking-wider text-soft">Sources</dt>
                  <dd className="mt-1 text-lg text-cream">{countrySources.length}</dd>
                  <dd className="text-[0.65rem] text-soft">{verifiedSources} verified</dd>
                </div>
                <div className="rounded-xl border border-sand-200 bg-void-elevated p-3">
                  <dt className="text-[0.65rem] uppercase tracking-wider text-soft">Claims</dt>
                  <dd className="mt-1 text-lg text-cream">{countryClaims}</dd>
                  <dd className="text-[0.65rem] text-soft">not suppressed</dd>
                </div>
                <div className="rounded-xl border border-sand-200 bg-void-elevated p-3">
                  <dt className="text-[0.65rem] uppercase tracking-wider text-soft">Blocks</dt>
                  <dd className="mt-1 text-lg text-cream">{countryBlocks}</dd>
                  <dd className="text-[0.65rem] text-soft">content units</dd>
                </div>
              </dl>

              <div className="mt-5 rounded-xl border border-sand-200 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Latest release</span>
                  {latestRelease ? <StatusBadge value={latestRelease.state} /> : null}
                </div>
                <p className="mt-2 text-xs text-soft">
                  {latestRelease
                    ? `Release ${latestRelease.release_number}${latestRelease.is_current ? " · current public version" : ""}`
                    : "No release has been created."}
                </p>
              </div>

              <div className="mt-auto pt-6">
                <Link href={`/admin/content/${country.slug}`} className={`${primaryButtonClass} w-full`}>
                  Open {country.name} workspace
                </Link>
              </div>
            </AdminCard>
          );
        })}
      </div>
    </div>
  );
}
