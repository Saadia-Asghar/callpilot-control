import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-card-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% from yesterday
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-accent">
          <Icon className="h-5 w-5 text-accent-foreground" />
        </div>
      </div>
    </div>
  );
}
