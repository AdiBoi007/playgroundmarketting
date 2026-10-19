export type AnalyticsEvent =
  | "hero_run_test_click"
  | "hero_waitlist_click"
  | "hero_how_it_works_click"
  | "nav_run_test_click"
  | "nav_waitlist_click"
  | "lead_form_started"
  | "lead_form_submitted"
  | "lead_form_error"
  | "waitlist_form_started"
  | "waitlist_form_submitted"
  | "waitlist_form_error"
  | "tester_form_started"
  | "tester_form_submitted"
  | "tester_form_error"
  | "use_case_open"
  | "final_cta_click";

declare global {
  interface Window {
    playgroundAnalytics?: (
      event: AnalyticsEvent,
      properties: Record<string, string | number>,
    ) => void;
  }
}

/** Provider-neutral hook. Never pass form values or personal data here. */
export function track(
  event: AnalyticsEvent,
  properties: Record<string, string | number> = {},
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("playground:analytics", { detail: { event, properties } }),
  );
  try {
    window.playgroundAnalytics?.(event, properties);
  } catch {
    /* Analytics must never interrupt a visitor action. */
  }
}
