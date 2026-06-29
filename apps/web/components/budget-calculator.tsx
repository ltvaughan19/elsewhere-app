"use client";

import { useMemo, useState } from "react";
import { Badge, TrustDisclaimer } from "@expat-atlas/ui";

type BudgetCategory =
  | "not_ready"
  | "risky"
  | "lean_but_possible"
  | "stable"
  | "strong";

function categorize(runwayMonths: number): BudgetCategory {
  if (runwayMonths < 3) return "not_ready";
  if (runwayMonths < 6) return "risky";
  if (runwayMonths < 9) return "lean_but_possible";
  if (runwayMonths < 12) return "stable";
  return "strong";
}

const categoryLabels: Record<BudgetCategory, string> = {
  not_ready: "Not ready yet",
  risky: "Risky — build more runway",
  lean_but_possible: "Lean but possible",
  stable: "Stable",
  strong: "Strong position",
};

export function BudgetCalculator() {
  const [savings, setSavings] = useState(15000);
  const [monthlyIncome, setMonthlyIncome] = useState(3500);
  const [usBills, setUsBills] = useState(1200);
  const [debt, setDebt] = useState(400);
  const [rentAbroad, setRentAbroad] = useState(800);
  const [food, setFood] = useState(400);
  const [insurance, setInsurance] = useState(150);
  const [visaFlights, setVisaFlights] = useState(200);
  const [emergencyTarget, setEmergencyTarget] = useState(3000);

  const result = useMemo(() => {
    const monthlyBurn =
      rentAbroad + food + insurance + visaFlights + usBills + debt;
    const netMonthly = monthlyIncome - monthlyBurn;
    const runwayMonths =
      monthlyBurn > 0 ? savings / monthlyBurn : savings > 0 ? 99 : 0;
    const safeDepartureTarget = monthlyBurn * 6 + emergencyTarget;
    const category = categorize(runwayMonths);

    return {
      monthlyBurn,
      netMonthly,
      runwayMonths: Math.min(99, runwayMonths),
      safeDepartureTarget,
      category,
    };
  }, [
    savings,
    monthlyIncome,
    usBills,
    debt,
    rentAbroad,
    food,
    insurance,
    visaFlights,
    emergencyTarget,
  ]);

  const field = (
    label: string,
    value: number,
    onChange: (v: number) => void,
  ) => (
    <label className="block space-y-1">
      <span className="text-sm text-navy-800/80">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-navy-950"
      />
    </label>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="font-display text-2xl text-navy-950">Your numbers</h2>
        {field("Current savings ($)", savings, setSavings)}
        {field("Monthly income ($)", monthlyIncome, setMonthlyIncome)}
        {field("U.S. bills you keep paying ($)", usBills, setUsBills)}
        {field("Debt payments ($)", debt, setDebt)}
        {field("Expected rent abroad ($)", rentAbroad, setRentAbroad)}
        {field("Food & local life ($)", food, setFood)}
        {field("Insurance ($)", insurance, setInsurance)}
        {field("Visa + phone + misc ($)", visaFlights, setVisaFlights)}
        {field("Emergency buffer target ($)", emergencyTarget, setEmergencyTarget)}
      </div>

      <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
        <Badge variant="demo">Planning estimate</Badge>
        <h2 className="mt-4 font-display text-2xl text-navy-950">Your runway</h2>
        <p className="mt-6 text-5xl font-semibold text-jungle-600">
          {result.runwayMonths.toFixed(1)} months
        </p>
        <p className="mt-2 text-lg text-navy-800">{categoryLabels[result.category]}</p>
        <dl className="mt-8 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-navy-800/70">Monthly burn abroad + obligations</dt>
            <dd className="font-medium">${result.monthlyBurn.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-800/70">Net monthly after costs</dt>
            <dd className="font-medium">${result.netMonthly.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-navy-800/70">Safer departure savings target</dt>
            <dd className="font-medium">
              ${result.safeDepartureTarget.toLocaleString()}
            </dd>
          </div>
        </dl>
        {result.category === "not_ready" || result.category === "risky" ? (
          <p className="mt-6 rounded-lg bg-sand-100 p-4 text-sm text-navy-800">
            Your biggest risk is not the flight — it is leaving without runway.
            Consider building savings or lowering monthly burn before departure.
          </p>
        ) : null}
        <TrustDisclaimer className="mt-6" />
      </div>
    </div>
  );
}
