import Link from "next/link";
import { Badge, TrustDisclaimer } from "@expat-atlas/ui";
import { LAUNCH_CORRIDORS, SEED_PATH_PACKS } from "@/lib/seed-corridors";
import { SEED_COUNTRIES } from "@/lib/seed-countries";

export default function CorridorsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-jungle-600">
        Elsewhere
      </p>
      <h1 className="mt-2 font-display text-4xl text-navy-950">
        Launch corridors
      </h1>
      <p className="mt-4 text-navy-800/80">
        Deep research paths for US planners exploring hotspots with large expat
        communities. More corridors can be added later as data — without rebuilding
        the platform.
      </p>
      <div className="mt-10 space-y-6">
        {LAUNCH_CORRIDORS.map((corridor) => {
          const country = SEED_COUNTRIES.find(
            (c) => c.slug === corridor.destinationSlug,
          );
          const pack = SEED_PATH_PACKS.find(
            (p) => p.corridorSlug === corridor.slug,
          );
          return (
            <article
              key={corridor.slug}
              className="rounded-xl border border-sand-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-2xl">{country?.flagEmoji}</p>
                  <h2 className="font-display text-2xl text-navy-950">
                    {corridor.name}
                  </h2>
                </div>
                <Badge variant="demo">Needs verification</Badge>
              </div>
              <p className="mt-3 text-sm text-navy-800/80">{corridor.summary}</p>
              {pack ? (
                <p className="mt-3 text-sm text-navy-800/70">
                  Path pack: <strong>{pack.name}</strong> ({pack.checklist.length}{" "}
                  starter steps)
                </p>
              ) : null}
              <Link
                href={`/countries/${corridor.destinationSlug}`}
                className="mt-4 inline-block text-sm font-medium text-jungle-600"
              >
                View country notes →
              </Link>
            </article>
          );
        })}
      </div>
      <TrustDisclaimer className="mt-10" />
    </div>
  );
}
