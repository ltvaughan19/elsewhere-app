import type { ReactNode } from "react";

export const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-sand-200 bg-void-elevated px-3 py-2.5 text-sm text-cream placeholder:text-soft focus:border-accent-cool disabled:cursor-not-allowed disabled:opacity-50";

export const textareaClass = `${fieldClass} min-h-28 resize-y`;

export const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-accent-sand px-5 py-2.5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-sand-hover disabled:cursor-not-allowed disabled:opacity-45";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-sand-300 bg-transparent px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-void-elevated disabled:cursor-not-allowed disabled:opacity-45";

export const quietButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-sand-200 px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-sand-300 hover:bg-void-elevated disabled:cursor-not-allowed disabled:opacity-45";

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`elsewhere-panel rounded-2xl p-5 md:p-6 ${className}`.trim()}
    >
      {children}
    </section>
  );
}

export function AdminSectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow ? <p className="elsewhere-eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-1 font-display text-2xl text-cream">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  approved: "border-success/30 bg-success/10 text-success",
  verified: "border-success/30 bg-success/10 text-success",
  published: "border-success/30 bg-success/10 text-success",
  current: "border-success/30 bg-success/10 text-success",
  ready: "border-accent-cool/30 bg-accent-cool/10 text-accent-cool",
  preview: "border-accent-cool/30 bg-accent-cool/10 text-accent-cool",
  core: "border-accent-cool/30 bg-accent-cool/10 text-accent-cool",
  deep: "border-accent-cool/30 bg-accent-cool/10 text-accent-cool",
  draft: "border-sand-300 bg-void-elevated text-muted",
  in_review: "border-warning/30 bg-warning/10 text-warning",
  changes_requested: "border-warning/30 bg-warning/10 text-warning",
  disputed: "border-danger/30 bg-danger/10 text-danger",
  rejected: "border-danger/30 bg-danger/10 text-danger",
  deprecated: "border-danger/30 bg-danger/10 text-danger",
  critical: "border-danger/30 bg-danger/10 text-danger",
  high: "border-danger/30 bg-danger/10 text-danger",
  medium: "border-warning/30 bg-warning/10 text-warning",
  low: "border-sand-300 bg-void-elevated text-muted",
};

export function StatusBadge({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const style = BADGE_STYLES[value] ?? BADGE_STYLES.draft;
  const visibleLabel = label ?? value.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-medium capitalize tracking-wide ${style}`}
    >
      {visibleLabel}
    </span>
  );
}

export function NoticeBanner({
  notice,
  error,
}: {
  notice?: string;
  error?: string;
}) {
  if (!notice && !error) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-2xl border px-4 py-3 text-sm ${
        error
          ? "border-danger/35 bg-danger/10 text-danger"
          : "border-success/35 bg-success/10 text-success"
      }`}
    >
      {error ?? notice}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-sand-300 bg-void-elevated px-5 py-8 text-center">
      <p className="text-sm font-medium text-cream">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{description}</p>
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
  help,
}: {
  htmlFor: string;
  children: ReactNode;
  help?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-cream">
      {children}
      {help ? <span className="mt-1 block text-xs font-normal text-soft">{help}</span> : null}
    </label>
  );
}
