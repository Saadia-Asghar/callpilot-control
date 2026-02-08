import { CalendarCheck, Phone, TrendingUp, Clock, PhoneMissed, Users, FileText } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { CallVolumeChart } from "@/components/dashboard/CallVolumeChart";
import { SuccessRateDonut } from "@/components/dashboard/SuccessRateDonut";
import { PeakHoursChart } from "@/components/dashboard/PeakHoursChart";
import { dashboardStats } from "@/data/mockData";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await api.getOperatorInsights(30);
        setInsights(data);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  // Use insights data if available, otherwise fallback to mock data
  const stats = insights ? {
    totalBookingsToday: insights.booking_metrics?.total_bookings_today || dashboardStats.totalBookingsToday,
    callSuccessRate: insights.call_metrics?.success_rate || dashboardStats.callSuccessRate,
  } : dashboardStats;

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview Dashboard</h1>
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
          title="Missed Recovered"
          value={3}
          subtitle="Out of 4 missed"
          icon={PhoneMissed}
          trend={{ value: 75, positive: true }}
          sparkline={[1, 0, 2, 1, 3, 2, 3]}
        />
        <StatCard
          title="Success Rate"
          value={`${dashboardStats.callSuccessRate}%`}
          icon={TrendingUp}
          trend={{ value: 3, positive: true }}
          sparkline={[88, 90, 89, 91, 92, 93, 92]}
        />
        <StatCard
          title="Draft Calls"
          value={4}
          subtitle="2 pending review"
          icon={FileText}
          sparkline={[2, 3, 1, 4, 3, 4, 4]}
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
