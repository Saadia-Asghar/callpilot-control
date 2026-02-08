import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface SuccessRateDonutProps {
  rate: number;
}

export function SuccessRateDonut({ rate }: SuccessRateDonutProps) {
  const data = [
    { name: "Success", value: rate },
    { name: "Failed", value: 100 - rate },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-2 text-sm font-semibold text-card-foreground">Success Rate</h3>
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={54}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                animationDuration={1200}
                animationEasing="ease-out"
                stroke="none"
              >
                <Cell fill="hsl(var(--chart-2))" />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-card-foreground">{rate}%</span>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
            <span className="text-muted-foreground">Successful ({rate}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-muted" />
            <span className="text-muted-foreground">Failed ({100 - rate}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
