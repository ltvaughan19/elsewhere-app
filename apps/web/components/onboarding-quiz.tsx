"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { OnboardingAnswers } from "@expat-atlas/types";
import { completeOnboarding, ensureGuestPlan } from "@/lib/plan-store";

const STEPS: {
  key: keyof OnboardingAnswers;
  label: string;
  why: string;
  type: "select" | "number" | "boolean";
  options?: { value: string; label: string }[];
}[] = [
  {
    key: "hasValidPassport",
    label: "Do you have a valid passport?",
    why: "Passport timing can determine which preparation task needs to happen first.",
    type: "select",
    options: [
      { value: "yes", label: "Yes, valid for 6+ months" },
      { value: "expiring_soon", label: "Yes, but expiring soon" },
      { value: "no", label: "No, not yet" },
    ],
  },
  {
    key: "monthlySavingsUsd",
    label: "How much can you save each month?",
    why: "This helps estimate your runway. It is never treated as financial advice.",
    type: "number",
  },
  {
    key: "monthlyIncomeUsd",
    label: "What is your monthly income after tax?",
    why: "Income helps shape budget ranges and the questions to research about working abroad.",
    type: "number",
  },
  {
    key: "targetMoveMonths",
    label: "How many months until you hope to move?",
    why: "Your timing keeps the plan focused on decisions that are actually approaching.",
    type: "number",
  },
  {
    key: "priority",
    label: "What matters most right now?",
    why: "Elsewhere uses this to order research, not to make the decision for you.",
    type: "select",
    options: [
      { value: "cost", label: "Lower cost of living" },
      { value: "community", label: "Social life and community" },
      { value: "nature", label: "Nature and lifestyle" },
      { value: "healthcare", label: "Healthcare access" },
      { value: "visa_ease", label: "A simpler long-stay path to research" },
    ],
  },
  {
    key: "remoteWork",
    label: "Will you work remotely abroad?",
    why: "Work circumstances can change which official rules and tax questions need verification.",
    type: "select",
    options: [
      { value: "yes", label: "Yes, with remote income" },
      { value: "planning", label: "I am planning to" },
      { value: "no", label: "No, retirement or another path" },
    ],
  },
  {
    key: "preferredCorridor",
    label: "Which country are you leaning toward?",
    why: "A preference gives your plan a starting point. You can compare or change it later.",
    type: "select",
    options: [
      { value: "philippines", label: "Philippines" },
      { value: "thailand", label: "Thailand" },
      { value: "mexico", label: "Mexico" },
      { value: "open", label: "I am still open" },
    ],
  },
  {
    key: "riskTolerance",
    label: "How much uncertainty are you comfortable with?",
    why: "This changes how strongly the plan emphasizes clarity, lead time, and professional review.",
    type: "select",
    options: [
      { value: "low", label: "Low — I prefer clarity" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High — I can manage ambiguity" },
    ],
  },
  {
    key: "travelingWithFamily",
    label: "Are you moving with a spouse or dependents?",
    why: "Dependents can affect documents, healthcare, schooling, and long-stay requirements.",
    type: "boolean",
  },
  {
    key: "priorTravelAbroad",
    label: "Have you traveled outside your home country before?",
    why: "Prior experience helps Elsewhere pace the preparation sequence without judging readiness.",
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

const destinationNames: Record<string, string> = {
  philippines: "Philippines",
  thailand: "Thailand",
  mexico: "Mexico",
};

export function OnboardingQuiz({ initialDestination }: { initialDestination?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => ({
    ...defaults,
    preferredCorridor:
      initialDestination === "philippines" ||
      initialDestination === "thailand" ||
      initialDestination === "mexico"
        ? initialDestination
        : "open",
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const existing = ensureGuestPlan();
    if (existing.answers) {
      setAnswers({
        ...existing.answers,
        ...(initialDestination
          ? { preferredCorridor: initialDestination as OnboardingAnswers["preferredCorridor"] }
          : {}),
      });
    }
  }, [initialDestination]);

  const current = STEPS[step];
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const setValue = (key: keyof OnboardingAnswers, value: string | number | boolean) => {
    setAnswers((previous) => ({ ...previous, [key]: value }));
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await completeOnboarding(answers);
      router.push("/app/path");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl pb-8 pt-2 sm:pt-6">
      <div className="flex items-center justify-between gap-6 text-xs font-medium uppercase tracking-[0.14em] text-soft">
        <span>Plan setup</span>
        <span>Step {step + 1} of {STEPS.length}</span>
      </div>
      <div className="mt-4 h-px bg-sand-200" aria-hidden="true">
        <div
          className="h-px bg-accent-sand transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="elsewhere-eyebrow mt-10">Your planning profile</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-cream sm:text-5xl">
        Build your Elsewhere profile
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        A few practical answers will put your research and preparation tasks in a useful order. You can revise every answer later.
      </p>
      {initialDestination ? (
        <p role="status" className="mt-5 border-l-2 border-accent-cool pl-4 text-sm leading-6 text-muted">
          {destinationNames[initialDestination]} is selected as your starting country. You can change it during setup.
        </p>
      ) : null}

      <fieldset className="mt-10">
        <legend className="max-w-xl text-xl font-medium leading-8 text-cream sm:text-2xl">
          {current.label}
        </legend>
        <p id="question-purpose" className="mt-3 max-w-xl text-sm leading-6 text-muted">
          {current.why}
        </p>

        <div className="mt-6 border-t border-sand-200">
          {current.type === "select" && current.options
            ? current.options.map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-14 cursor-pointer items-center gap-4 border-b border-sand-200 px-1 py-3 text-cream transition-colors duration-150 hover:bg-void-elevated has-[:checked]:bg-void-elevated"
                >
                  <input
                    type="radio"
                    name={current.key}
                    checked={String(answers[current.key]) === option.value}
                    onChange={() => setValue(current.key, option.value)}
                    aria-describedby="question-purpose"
                    className="h-4 w-4 accent-[var(--ea-accent)]"
                  />
                  <span className="text-base">{option.label}</span>
                </label>
              ))
            : null}

          {current.type === "number" ? (
            <div className="relative border-b border-sand-300">
              <span className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-sm text-soft">
                {current.key === "targetMoveMonths" ? "Months" : "USD"}
              </span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                aria-describedby="question-purpose"
                value={answers[current.key] as number}
                onChange={(event) => setValue(current.key, Number(event.target.value))}
                className="min-h-16 w-full border-0 bg-transparent pl-20 pr-2 text-xl text-cream focus:outline-none"
              />
            </div>
          ) : null}

          {current.type === "boolean" ? (
            <div className="grid grid-cols-2 border-b border-sand-200">
              {[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => setValue(current.key, option.value)}
                  aria-describedby="question-purpose"
                  aria-pressed={answers[current.key] === option.value}
                  className={
                    answers[current.key] === option.value
                      ? "min-h-14 border-t border-accent-sand bg-void-elevated px-5 text-base font-medium text-cream"
                      : "min-h-14 border-t border-sand-200 px-5 text-base text-muted hover:bg-void-elevated hover:text-cream"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </fieldset>

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-sand-200 pt-6">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((currentStep) => currentStep - 1)}
          className="inline-flex min-h-12 items-center px-2 text-sm font-medium text-muted hover:text-cream disabled:cursor-not-allowed disabled:opacity-35"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((currentStep) => currentStep + 1)}
            className="inline-flex min-h-12 items-center rounded-md bg-accent-sand px-6 text-sm font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-sand-hover"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => void finish()}
            className="inline-flex min-h-12 items-center rounded-md bg-accent-sand px-6 text-sm font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-sand-hover disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Saving…" : "See my path"}
          </button>
        )}
      </div>

      <p className="mt-8 max-w-xl text-xs leading-5 text-soft">
        Elsewhere uses these answers for planning estimates only. They do not replace legal, immigration, tax, or financial advice.
      </p>
    </div>
  );
}
