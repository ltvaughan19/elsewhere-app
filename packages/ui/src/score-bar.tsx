import { cn } from "./utils";

export function ScoreBar({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  const color =
    value >= 70 ? "bg-jungle-600" : value >= 40 ? "bg-ocean-500" : "bg-sand-300";

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs text-navy-800">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-sand-200">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
