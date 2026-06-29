export const ANALYTICS_EVENTS = {
  LANDING_CTA_CLICK: "landing_cta_click",
  ONBOARDING_STARTED: "onboarding_started",
  ONBOARDING_COMPLETED: "onboarding_completed",
  BUDGET_CALCULATED: "budget_calculated",
  PASSPORT_STEP_UPDATED: "passport_step_updated",
  COUNTRY_VIEWED: "country_viewed",
  REPORT_OUTDATED_INFO: "report_outdated_info",
  WAITLIST_JOINED: "waitlist_joined",
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined") return;

  // PostHog stub — wire when NEXT_PUBLIC_POSTHOG_KEY is set
  const w = window as Window & {
    posthog?: { capture: (e: string, p?: Record<string, unknown>) => void };
  };
  if (w.posthog) {
    w.posthog.capture(event, properties);
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, properties);
  }
}
