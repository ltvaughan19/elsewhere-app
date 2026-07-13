"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CountryCard } from "@expat-atlas/ui";
import { SEED_COUNTRIES } from "@/lib/seed-countries";
import { loadPlan, updateSavedCountries } from "@/lib/plan-store";

export default function SavedPage() {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const plan = loadPlan();
    if (plan?.savedCountrySlugs.length) {
      setSaved(plan.savedCountrySlugs);
    } else if (plan?.readiness) {
      const initial = [
        plan.readiness.bestFitSlug,
        ...plan.readiness.backupSlugs,
      ].slice(0, 3);
      setSaved(initial);
      updateSavedCountries(initial);
    }
  }, []);

  const toggle = (slug: string) => {
    setSaved((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      updateSavedCountries(next);
      return next;
    });
  };

  const countries = SEED_COUNTRIES.filter((c) => saved.includes(c.slug));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl text-navy-950">Saved countries</h1>
      <p className="mt-2 text-sm text-navy-800/70">
        Toggle countries from the list below to track your shortlist.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {SEED_COUNTRIES.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => toggle(c.slug)}
            className={
              saved.includes(c.slug)
                ? "rounded-full bg-jungle-600 px-3 py-1.5 text-sm text-white"
                : "rounded-full border border-sand-200 px-3 py-1.5 text-sm text-navy-900"
            }
          >
            {c.flagEmoji} {c.name}
          </button>
        ))}
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {countries.length === 0 ? (
          <p className="text-sm text-navy-800/60">
            No countries saved yet.{" "}
            <Link href="/compare" className="text-jungle-600">
              Compare countries
            </Link>
          </p>
        ) : (
          countries.map((c) => <CountryCard key={c.slug} country={c} />)
        )}
      </div>
    </div>
  );
}
