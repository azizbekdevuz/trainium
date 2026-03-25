import { cn } from "@/lib/utils/format";

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  /** Optional CSS color (e.g. `var(--accent)` or hex) for tinted gradient */
  accentHex?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  delta,
  positive = true,
  icon,
  accentHex,
  className,
}: MetricCardProps) {
  const cardStyle =
    accentHex != null && accentHex.length > 0
      ? {
          background: `linear-gradient(145deg, color-mix(in srgb, ${accentHex} 18%, transparent) 0%, color-mix(in srgb, ${accentHex} 6%, transparent) 100%)`,
          borderColor: `color-mix(in srgb, ${accentHex} 30%, transparent)`,
        }
      : undefined;

  return (
    <div className={cn("stat-card border", className)} style={cardStyle}>
      <div className="relative z-10">
        <div className="mb-3.5 flex items-start justify-between">
          {icon ? (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[15px] bg-ui-inset text-ui-primary dark:bg-black/25 dark:text-ui-secondary"
            >
              {icon}
            </div>
          ) : null}
          {delta ? (
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide",
                positive
                  ? "border-green-500/30 bg-green-500/20 text-green-300"
                  : "border-red-500/30 bg-red-500/20 text-red-300",
              )}
            >
              {delta}
            </span>
          ) : null}
        </div>
        <div className="font-display mb-0.5 text-[21px] font-extrabold tracking-tight text-ui-primary">
          {value}
        </div>
        <div className="text-[11px] tracking-wide text-ui-secondary dark:text-ui-muted">
          {label}
        </div>
      </div>
    </div>
  );
}
