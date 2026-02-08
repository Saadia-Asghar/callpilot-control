import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface SparkData {
  value: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  sparkline?: number[];
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 64;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");

  return (
    <svg width={w} height={h} className="mt-1">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, sparkline }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={`flex items-center gap-1 text-[11px] font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.value)}% from yesterday
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-accent group-hover:shadow-glow transition-shadow">
            <Icon className="h-4 w-4 text-accent-foreground" />
          </div>
          {sparkline && <MiniSparkline data={sparkline} />}
        </div>
      </div>
    </div>
  );
}
