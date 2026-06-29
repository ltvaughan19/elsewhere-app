"use client";

import { useMemo, useState } from "react";
import type { CountryCardData } from "@expat-atlas/types";
import { Badge, ScoreBar, TrustDisclaimer } from "@expat-atlas/ui";
import { SEED_COUNTRIES } from "@/lib/seed-countries";

function CompareColumn({ country }: { country: CountryCardData | null }) {
  if (!country) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-sand-300 bg-sand-100 p-6 text-sm text-navy-800/60">
        Select a country
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-3xl">{country.flagEmoji}</p>
          <h3 className="font-display text-2xl text-navy-950">{country.name}</h3>
        </div>
        <Badge variant="demo">Planning estimate</Badge>
      </div>
      <dl className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-navy-800/70">Monthly cost</dt>
          <dd>{country.monthlyCostEstimate}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-navy-800/70">Visa complexity</dt>
          <dd>{country.visaComplexity}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-navy-800/70">Long-stay potential</dt>
          <dd>{country.longStayPotential}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-navy-800/70">Property complexity</dt>
          <dd>{country.propertyComplexity}</dd>
        </div>
      </dl>
      <div className="space-y-2">
        <ScoreBar label="Nature" value={country.natureScore} />
        <ScoreBar label="Social" value={country.socialScore} />
        <ScoreBar label="Healthcare" value={country.healthcareScore} />
        <ScoreBar label="Internet" value={country.internetScore} />
      </div>
    </div>
  );
}

export function CountryCompare() {
  const [a, setA] = useState("philippines");
  const [b, setB] = useState("thailand");

  const countryA = useMemo(
    () => SEED_COUNTRIES.find((c) => c.slug === a) ?? null,
    [a],
  );
  const countryB = useMemo(
    () => SEED_COUNTRIES.find((c) => c.slug === b) ?? null,
    [b],
  );

  const select = (
    value: string,
    onChange: (v: string) => void,
    label: string,
  ) => (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-navy-800">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-navy-950"
      >
        {SEED_COUNTRIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.flagEmoji} {c.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div>
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {select(a, setA, "Country A")}
        {select(b, setB, "Country B")}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <CompareColumn country={countryA} />
        <CompareColumn country={countryB} />
      </div>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
