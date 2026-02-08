import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { day: "Mon", calls: 18 },
  { day: "Tue", calls: 24 },
  { day: "Wed", calls: 20 },
  { day: "Thu", calls: 32 },
  { day: "Fri", calls: 28 },
  { day: "Sat", calls: 22 },
  { day: "Sun", calls: 30 },
];

export function CallVolumeChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="mb-4 text-sm font-semibold text-card-foreground">Call Volume (7 Days)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              color: "hsl(var(--card-foreground))",
            }}
          />
          <Line
            type="monotone"
            dataKey="calls"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2.5}
            dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
