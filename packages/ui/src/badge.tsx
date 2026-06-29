import { cn } from "./utils";

const variants = {
  default: "bg-sand-200 text-navy-950",
  official: "bg-ocean-500/15 text-ocean-500 border border-ocean-500/30",
  sponsored: "bg-gold-400/15 text-gold-500 border border-gold-400/40",
  demo: "bg-sand-200 text-navy-800 border border-dashed border-navy-800/30",
  risk: "bg-red-100 text-red-800 border border-red-200",
  success: "bg-jungle-600/15 text-jungle-600 border border-jungle-600/30",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
