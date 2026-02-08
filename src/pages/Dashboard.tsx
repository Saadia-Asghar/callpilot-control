import { CalendarCheck, Phone, TrendingUp, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { CallVolumeChart } from "@/components/dashboard/CallVolumeChart";
import { SuccessRateDonut } from "@/components/dashboard/SuccessRateDonut";
import { PeakHoursChart } from "@/components/dashboard/PeakHoursChart";
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
          sparkline={[14, 18, 16, 22, 20, 24, 24]}
        />
        <StatCard
          title="Upcoming"
          value={dashboardStats.upcomingAppointments}
          subtitle="Next 24 hours"
          icon={Clock}
          sparkline={[6, 8, 5, 7, 9, 8, 8]}
        />
        <StatCard
          title="Success Rate"
          value={`${dashboardStats.callSuccessRate}%`}
          icon={TrendingUp}
          trend={{ value: 3, positive: true }}
          sparkline={[88, 90, 89, 91, 92, 93, 92]}
        />
        <StatCard
          title="Total Calls"
          value={dashboardStats.totalCalls}
          subtitle="This week"
          icon={Phone}
          sparkline={[120, 135, 128, 142, 150, 148, 156]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CallVolumeChart />
        <SuccessRateDonut rate={dashboardStats.callSuccessRate} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <PeakHoursChart />
      </div>
    </div>
  );
}
