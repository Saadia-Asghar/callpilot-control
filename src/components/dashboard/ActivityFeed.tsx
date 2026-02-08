import { CalendarPlus, Phone, RefreshCw, X } from "lucide-react";
import { recentActivity } from "@/data/mockData";

const iconMap = {
  booking: CalendarPlus,
  call: Phone,
  reschedule: RefreshCw,
  cancel: X,
};

const statusColors = {
  success: "bg-success/15 text-success",
  active: "bg-info/15 text-info",
  warning: "bg-warning/15 text-warning",
  error: "bg-destructive/15 text-destructive",
};

export function ActivityFeed() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="border-b border-border p-4">
        <h3 className="text-sm font-semibold text-card-foreground">Recent Activity</h3>
      </div>
      <div className="divide-y divide-border">
        {recentActivity.map((item) => {
          const Icon = iconMap[item.type];
          return (
            <div key={item.id} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${statusColors[item.status]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-card-foreground">{item.message}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
