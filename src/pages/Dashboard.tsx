import { CalendarCheck, Phone, TrendingUp, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { dashboardStats } from "@/data/mockData";

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">Monitor your AI scheduling agent in real-time</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Bookings Today"
          value={dashboardStats.totalBookingsToday}
          icon={CalendarCheck}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Upcoming"
          value={dashboardStats.upcomingAppointments}
          subtitle="Next 24 hours"
          icon={Clock}
        />
        <StatCard
          title="Success Rate"
          value={`${dashboardStats.callSuccessRate}%`}
          icon={TrendingUp}
          trend={{ value: 3, positive: true }}
        />
        <StatCard
          title="Total Calls"
          value={dashboardStats.totalCalls}
          subtitle="This week"
          icon={Phone}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-card-foreground">Call Volume (7 Days)</h3>
          <div className="flex h-48 items-end gap-2">
            {[18, 24, 20, 32, 28, 22, 30].map((val, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md gradient-primary transition-all hover:opacity-80"
                  style={{ height: `${(val / 32) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
