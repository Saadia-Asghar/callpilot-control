import { useState } from "react";
import { Bell, X, PhoneMissed, CheckCircle2, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const notifications = [
  { id: 1, type: "recovery" as const, message: "Missed call from +1 (650) 555-0198 recovered", time: "2m ago", read: false },
  { id: 2, type: "booking" as const, message: "Sarah Chen booking confirmed for Tuesday 9 AM", time: "5m ago", read: false },
  { id: 3, type: "warning" as const, message: "Draft call for Tom Wilson awaiting finalization", time: "12m ago", read: true },
  { id: 4, type: "recovery" as const, message: "Auto-recovery attempt for +1 (415) 555-0244", time: "18m ago", read: true },
];

const iconMap = {
  recovery: PhoneMissed,
  booking: CheckCircle2,
  warning: AlertTriangle,
};

const colorMap = {
  recovery: "bg-info/15 text-info",
  booking: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg relative" onClick={() => setOpen(!open)}>
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-card shadow-elevated overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border p-3">
                <h4 className="text-xs font-semibold text-card-foreground">Notifications</h4>
                <Badge variant="outline" className="text-[9px]">{unread} new</Badge>
              </div>
              <div className="max-h-72 overflow-auto divide-y divide-border">
                {notifications.map((n) => {
                  const Icon = iconMap[n.type];
                  return (
                    <div key={n.id} className={`flex items-start gap-2.5 p-3 transition-colors hover:bg-muted/50 ${!n.read ? "bg-accent/30" : ""}`}>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colorMap[n.type]}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-card-foreground leading-tight">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
