import { cn } from "./utils";

const variants = {
  default: "bg-sand-100 text-navy-950 border border-sand-200",
  official: "bg-ocean-500/12 text-ocean-500 border border-ocean-500/30",
  sponsored: "bg-gold-400/12 text-gold-500 border border-gold-400/35",
  demo: "bg-sand-100 text-navy-800 border border-dashed border-sand-300",
  risk: "elsewhere-badge-risk",
  success: "bg-jungle-600/12 text-jungle-600 border border-jungle-600/30",
} as const;

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
