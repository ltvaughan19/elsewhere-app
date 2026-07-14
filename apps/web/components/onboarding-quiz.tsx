"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { OnboardingAnswers } from "@expat-atlas/types";
import { TrustDisclaimer } from "@expat-atlas/ui";
import { completeOnboarding, ensureGuestPlan } from "@/lib/plan-store";

const STEPS: {
  key: keyof OnboardingAnswers;
  label: string;
  type: "select" | "number" | "boolean";
  options?: { value: string; label: string }[];
}[] = [
  {
    key: "hasValidPassport",
    label: "Do you have a valid passport?",
    type: "select",
    options: [
      { value: "yes", label: "Yes, valid 6+ months" },
      { value: "expiring_soon", label: "Yes, but expiring soon" },
      { value: "no", label: "No / not yet" },
    ],
  },
  {
    key: "monthlySavingsUsd",
    label: "How much can you save per month? (USD, planning estimate)",
    type: "number",
  },
  {
    key: "monthlyIncomeUsd",
    label: "Monthly income after taxes? (USD)",
    type: "number",
  },
  {
    key: "targetMoveMonths",
    label: "Target months until move",
    type: "number",
  },
  {
    key: "priority",
    label: "What matters most right now?",
    type: "select",
    options: [
      { value: "cost", label: "Lower cost of living" },
      { value: "community", label: "Social life & expat community" },
      { value: "nature", label: "Nature & lifestyle" },
      { value: "healthcare", label: "Healthcare access" },
      { value: "visa_ease", label: "Simpler visa path (research)" },
    ],
  },
  {
    key: "remoteWork",
    label: "Will you work remotely abroad?",
    type: "select",
    options: [
      { value: "yes", label: "Yes, remote income" },
      { value: "planning", label: "Planning to" },
      { value: "no", label: "No / retirement / other" },
    ],
  },
  {
    key: "preferredCorridor",
    label: "Which corridor are you leaning toward?",
    type: "select",
    options: [
      { value: "philippines", label: "Philippines" },
      { value: "thailand", label: "Thailand" },
      { value: "mexico", label: "Mexico" },
      { value: "open", label: "Still open" },
    ],
  },
  {
    key: "riskTolerance",
    label: "Risk tolerance for bureaucracy & rule changes",
    type: "select",
    options: [
      { value: "low", label: "Low — prefer clarity" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High — comfortable with ambiguity" },
    ],
  },
  {
    key: "travelingWithFamily",
    label: "Moving with dependents or spouse?",
    type: "boolean",
  },
  {
    key: "priorTravelAbroad",
    label: "Have you traveled outside your home country before?",
    type: "boolean",
  },
];

const defaults: OnboardingAnswers = {
  hasValidPassport: "no",
  monthlySavingsUsd: 500,
  monthlyIncomeUsd: 3000,
  targetMoveMonths: 12,
  priority: "cost",
  remoteWork: "planning",
  travelingWithFamily: false,
  priorTravelAbroad: false,
  riskTolerance: "medium",
  preferredCorridor: "open",
};

export function OnboardingQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(defaults);

  useEffect(() => {
    ensureGuestPlan();
  }, []);

  const current = STEPS[step];
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const setValue = (key: keyof OnboardingAnswers, value: string | number | boolean) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const finish = () => {
    completeOnboarding(answers);
    router.push("/app/path");
  };

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-medium uppercase tracking-wide text-jungle-600">
        Readiness quiz
      </p>
      <h1 className="mt-2 font-display text-3xl text-navy-950">
        Build your Elsewhere profile
      </h1>
      <p className="mt-2 text-sm text-navy-800">
        Planning estimates only — not legal or immigration advice.
      </p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-sand-200">
        <div
          className="h-full bg-jungle-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <fieldset className="mt-8 space-y-4">
        <legend className="text-lg font-medium text-navy-950">{current.label}</legend>
        {current.type === "select" && current.options
          ? current.options.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-sand-200 bg-void-card p-4 shadow-ea has-[:checked]:border-accent-sand has-[:checked]:ring-1 has-[:checked]:ring-accent-sand"
              >
                <input
                  type="radio"
                  name={current.key}
                  checked={String(answers[current.key]) === opt.value}
                  onChange={() => setValue(current.key, opt.value)}
                  className="text-jungle-600"
                />
                <span className="text-sm text-cream">{opt.label}</span>
              </label>
            ))
          : null}
        {current.type === "number" ? (
          <input
            type="number"
            min={0}
            value={answers[current.key] as number}
            onChange={(e) => setValue(current.key, Number(e.target.value))}
            className="w-full rounded-xl border border-sand-200 bg-void-card px-4 py-3 text-cream"
          />
        ) : null}
        {current.type === "boolean" ? (
          <div className="flex gap-3">
            {[
              { v: true, l: "Yes" },
              { v: false, l: "No" },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => setValue(current.key, opt.v)}
                className={
                  answers[current.key] === opt.v
                    ? "rounded-full bg-jungle-600 px-5 py-2 text-sm font-medium text-accent-ink"
                    : "rounded-full border border-sand-200 px-5 py-2 text-sm text-cream"
                }
              >
                {opt.l}
              </button>
            ))}
          </div>
        ) : null}
      </fieldset>
      <div className="mt-8 flex justify-between gap-4">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="rounded-full border border-sand-200 px-5 py-2.5 text-sm disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-full bg-jungle-600 px-5 py-2.5 text-sm font-medium text-accent-ink"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="rounded-full bg-jungle-600 px-5 py-2.5 text-sm font-medium text-accent-ink"
          >
            See my path
          </button>
        )}
      </div>
      <TrustDisclaimer className="mt-8" />
    </div>
  );
}
