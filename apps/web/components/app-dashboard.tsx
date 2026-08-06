"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { UserPlan } from "@expat-atlas/types";
import { SEED_COUNTRIES } from "@/lib/seed-countries";
import { persistPlan, resolvePlan } from "@/lib/plan-store";
import type { SundayActionView } from "@/lib/sunday-action-types";
import { isoWeekKey } from "@/lib/sunday-week";

type PlanTask = {
  title: string;
  detail: string;
  href: string;
  status: "Next" | "Ready" | "Review";
};

function formatVerifiedDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function AppDashboard({
  sundayAction,
}: {
  sundayAction: SundayActionView | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [markingDone, setMarkingDone] = useState(false);
  const weekKey = isoWeekKey();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const resolved = await resolvePlan();
      if (cancelled) return;
      if (!resolved) {
        router.replace("/signup");
        return;
      }
      if (!resolved.onboardingCompleted) {
        router.replace("/app/onboarding");
        return;
      }
      setPlan(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!plan?.readiness) {
    return (
      <div role="status" className="mx-auto max-w-5xl py-12 text-sm text-muted">
        Preparing your plan&hellip;
      </div>
    );
  }

  const best = SEED_COUNTRIES.find((country) => country.slug === plan.readiness?.bestFitSlug);
  const moveTiming = plan.answers?.targetMoveMonths
    ? `${plan.answers.targetMoveMonths} months`
    : "Not set";
  const passportReady = plan.answers?.hasValidPassport === "yes";
  const tasks: PlanTask[] = [
    {
      title: "Review your research path",
      detail: `Start with ${best?.name ?? "your leading country"} and verify the route that fits your circumstances.`,
      href: "/app/path",
      status: "Next",
    },
    {
      title: "Confirm passport readiness",
      detail: passportReady
        ? "Your profile says your passport has at least six months remaining."
        : "Check validity, blank pages, and renewal timing before researching entry routes.",
      href: "/app/passport",
      status: passportReady ? "Ready" : "Review",
    },
    {
      title: "Build a realistic move budget",
      detail: "Separate setup costs, monthly living costs, and an emergency runway.",
      href: "/app/budget",
      status: "Review",
    },
  ];

  const doneThisWeek =
    Boolean(sundayAction) &&
    plan.sundayActionProgress?.completedWeekKey === weekKey &&
    plan.sundayActionProgress?.actionSlug === sundayAction?.blockSlug;

  const verifiedLabel = formatVerifiedDate(sundayAction?.lastVerifiedAt);

  const markDoneThisWeek = async () => {
    if (!sundayAction || markingDone) return;
    setMarkingDone(true);
    try {
      const updated = await persistPlan({
        ...plan,
        sundayActionProgress: {
          completedWeekKey: weekKey,
          completedAt: new Date().toISOString(),
          actionSlug: sundayAction.blockSlug,
          countrySlug: sundayAction.countrySlug,
        },
      });
      setPlan(updated);
    } finally {
      setMarkingDone(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-sand-200 pb-8 sm:flex sm:items-end sm:justify-between sm:gap-8 sm:pb-10">
        <div>
          <p className="text-sm text-muted">Welcome back, {plan.displayName || "planner"}</p>
          <h1 className="mt-2 font-display text-4xl leading-none text-cream sm:text-5xl">
            Your move, in order.
          </h1>
        </div>
        <p className="mt-5 max-w-sm text-sm leading-6 text-muted sm:mt-0 sm:text-right">
          Planning guidance is tailored from your answers. Official requirements still need direct verification.
        </p>
      </header>

      <section
        className="grid gap-8 border-b border-sand-200 py-9 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,0.7fr)] lg:gap-14 lg:py-12"
        aria-labelledby="sunday-action-heading"
      >
        <div>
          <p className="elsewhere-eyebrow">Sunday Action</p>
          <h2
            id="sunday-action-heading"
            className="mt-4 max-w-2xl text-2xl font-medium leading-tight text-cream sm:text-3xl"
          >
            {sundayAction?.title ?? plan.readiness.nextStep}
          </h2>
          {sundayAction ? (
            <div className="mt-4 max-w-2xl space-y-3 text-base leading-7 text-muted">
              {sundayAction.paragraphs.map((paragraph, index) => (
                <p key={`sunday-p-${index}`}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Work through the next decision first. Elsewhere will keep the rest of the move visible without asking you to solve everything at once.
            </p>
          )}

          <div
            className="mt-6 max-w-2xl border-l border-sand-300 pl-4 text-xs leading-6 text-soft"
            aria-label="Trust strip"
          >
            {sundayAction ? (
              <>
                <p>
                  Source:{" "}
                  {sundayAction.sourceUrl ? (
                    <a
                      href={sundayAction.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent-cool hover:text-cream"
                    >
                      {sundayAction.sourceTitle ?? "Official source"}
                    </a>
                  ) : (
                    <span className="font-medium text-cream">
                      {sundayAction.sourceTitle ?? "Published corridor release"}
                    </span>
                  )}
                  {verifiedLabel ? ` · Verified ${verifiedLabel}` : null}
                  {sundayAction.releaseNumber
                    ? ` · Release ${sundayAction.releaseNumber}`
                    : null}
                </p>
                <p className="mt-1">
                  Planning research only — not legal, immigration, or tax advice. Verify on the official page before acting.
                </p>
              </>
            ) : (
              <p>
                Derived from your Fit Quiz answers until a published corridor next action is available for your path. Not legal advice.
              </p>
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={sundayAction?.portalHref ?? "/app/path"}
              className="inline-flex min-h-12 items-center rounded-md bg-accent-sand px-5 text-sm font-medium text-accent-ink transition-colors duration-150 hover:bg-accent-sand-hover"
            >
              {sundayAction ? `Open ${sundayAction.countryName} Entry & Stay` : "Open your research path"}
            </Link>
            {sundayAction ? (
              doneThisWeek ? (
                <p role="status" className="text-sm font-medium text-success">
                  Done this week
                </p>
              ) : (
                <button
                  type="button"
                  disabled={markingDone}
                  onClick={() => void markDoneThisWeek()}
                  className="inline-flex min-h-12 items-center rounded-md border border-sand-300 px-5 text-sm font-medium text-cream transition-colors duration-150 hover:border-sand-200 disabled:cursor-wait disabled:opacity-50"
                >
                  {markingDone ? "Saving…" : "Done this week?"}
                </button>
              )
            ) : null}
          </div>
          <p className="mt-4 max-w-2xl text-xs leading-6 text-soft">
            Evidence boundary: Elsewhere saves research and plans. It does not file applications, decide eligibility, or replace official instructions.
          </p>
        </div>

        <dl className="divide-y divide-sand-200 border-y border-sand-200">
          <div className="flex items-baseline justify-between gap-5 py-4">
            <dt className="text-sm text-muted">Readiness</dt>
            <dd className="font-display text-3xl text-cream">{plan.readiness.score}%</dd>
          </div>
          <div className="flex items-baseline justify-between gap-5 py-4">
            <dt className="text-sm text-muted">Leading country</dt>
            <dd className="text-right text-base font-medium text-cream">{best?.name ?? plan.readiness.bestFitSlug}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-5 py-4">
            <dt className="text-sm text-muted">Target timing</dt>
            <dd className="text-right text-base font-medium text-cream">{moveTiming}</dd>
          </div>
        </dl>
      </section>

      <section className="py-9 sm:py-12" aria-labelledby="plan-sequence-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="elsewhere-eyebrow">Plan sequence</p>
            <h2 id="plan-sequence-heading" className="mt-3 text-2xl font-medium text-cream">
              What to work through next
            </h2>
          </div>
          <Link href="/app/my-plan" className="inline-flex min-h-11 items-center text-sm font-medium text-accent-cool hover:text-cream">
            View the full plan <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>
        </div>

        <ol className="mt-6 border-t border-sand-200">
          {tasks.map((task, index) => (
            <li key={task.href} className="border-b border-sand-200">
              <Link
                href={task.href}
                className="group grid min-h-24 gap-3 py-5 sm:grid-cols-[2.25rem_minmax(0,1fr)_5rem] sm:items-center sm:gap-5"
              >
                <span className="field-guide-index text-xs text-soft">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-base font-medium text-cream transition-colors duration-150 group-hover:text-accent-cool">
                    {task.title}
                  </span>
                  <span className="mt-1 block max-w-2xl text-sm leading-6 text-muted">{task.detail}</span>
                </span>
                <span className="text-sm font-medium text-soft sm:text-right">{task.status}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {plan.readiness.warningFlags.length > 0 ? (
        <aside className="border-l-2 border-warning bg-void-elevated px-5 py-4 text-sm leading-6 text-muted">
          <p className="font-medium text-cream">A planning assumption needs attention</p>
          <p className="mt-1">{plan.readiness.warningFlags[0]}</p>
          <Link href="/app/onboarding" className="mt-2 inline-flex min-h-11 items-center font-medium text-accent-cool hover:text-cream">
            Review your answers
          </Link>
        </aside>
      ) : null}
    </div>
  );
}
