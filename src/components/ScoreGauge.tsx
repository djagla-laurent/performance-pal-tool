import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number | null;
  label?: string;
  size?: "sm" | "md" | "lg";
}

function scoreColor(score: number | null): string {
  if (score == null) return "var(--color-muted-foreground)";
  if (score >= 90) return "var(--color-success)";
  if (score >= 50) return "var(--color-warning)";
  return "var(--color-destructive)";
}

export function ScoreGauge({ score, label, size = "md" }: ScoreGaugeProps) {
  const sizes = {
    sm: { box: "w-16 h-16", text: "text-lg", stroke: 6, r: 28 },
    md: { box: "w-28 h-28", text: "text-3xl", stroke: 8, r: 46 },
    lg: { box: "w-40 h-40", text: "text-5xl", stroke: 10, r: 66 },
  }[size];

  const r = sizes.r;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  const offset = c - (pct / 100) * c;
  const viewBox = (r + sizes.stroke) * 2;
  const color = scoreColor(score);

  return (
    <div className={cn("relative inline-flex flex-col items-center gap-2")}>
      <div className={cn("relative", sizes.box)}>
        <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="-rotate-90 h-full w-full">
          <circle
            cx={viewBox / 2}
            cy={viewBox / 2}
            r={r}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={sizes.stroke}
          />
          <circle
            cx={viewBox / 2}
            cy={viewBox / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={sizes.stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-display font-semibold tabular-nums", sizes.text)} style={{ color }}>
            {score == null ? "–" : score}
          </span>
        </div>
      </div>
      {label && <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>}
    </div>
  );
}
