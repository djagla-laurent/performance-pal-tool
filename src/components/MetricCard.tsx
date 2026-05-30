import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  status?: "good" | "needs-improvement" | "poor" | null;
  description?: string;
}

const statusStyles = {
  good: "border-l-[color:var(--color-success)] text-[color:var(--color-success)]",
  "needs-improvement": "border-l-[color:var(--color-warning)] text-[color:var(--color-warning)]",
  poor: "border-l-[color:var(--color-destructive)] text-[color:var(--color-destructive)]",
};

export function MetricCard({ label, value, unit, status, description }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 border-l-4 shadow-sm",
        status ? statusStyles[status] : "border-l-muted",
      )}
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-3xl font-semibold tabular-nums text-foreground">
          {value ?? "–"}
        </span>
        {unit && value != null && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
    </div>
  );
}

export function classifyLCP(ms: number | null) {
  if (ms == null) return null;
  return ms <= 2500 ? "good" : ms <= 4000 ? "needs-improvement" : "poor";
}
export function classifyCLS(v: number | null) {
  if (v == null) return null;
  return v <= 0.1 ? "good" : v <= 0.25 ? "needs-improvement" : "poor";
}
export function classifyINP(ms: number | null) {
  if (ms == null) return null;
  return ms <= 200 ? "good" : ms <= 500 ? "needs-improvement" : "poor";
}
export function classifyFCP(ms: number | null) {
  if (ms == null) return null;
  return ms <= 1800 ? "good" : ms <= 3000 ? "needs-improvement" : "poor";
}
export function classifyTBT(ms: number | null) {
  if (ms == null) return null;
  return ms <= 200 ? "good" : ms <= 600 ? "needs-improvement" : "poor";
}
