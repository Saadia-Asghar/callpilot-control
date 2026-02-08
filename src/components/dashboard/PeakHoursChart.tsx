import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { hour: "9AM", calls: 12 },
  { hour: "10AM", calls: 18 },
  { hour: "11AM", calls: 24 },
  { hour: "12PM", calls: 15 },
  { hour: "1PM", calls: 20 },
  { hour: "2PM", calls: 22 },
  { hour: "3PM", calls: 16 },
  { hour: "4PM", calls: 10 },
];

export function PeakHoursChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-4 text-sm font-semibold text-card-foreground">Peak Hours Today</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              color: "hsl(var(--card-foreground))",
            }}
          />
          <Bar
            dataKey="calls"
            fill="hsl(var(--chart-4))"
            radius={[4, 4, 0, 0]}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
