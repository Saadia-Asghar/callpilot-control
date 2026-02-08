import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAppointments } from "@/lib/dataService";
import { useToast } from "@/hooks/use-toast";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hours = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

const statusStyles = {
  confirmed: "bg-primary/15 border-primary/30 text-primary",
  pending: "bg-warning/15 border-warning/30 text-warning",
  available: "border-dashed border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer",
};

export default function CalendarView() {
  const [view, setView] = useState<"week" | "day">("week");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Backend calendar update could be added here; for demo we just invalidate
      await Promise.resolve({ id, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Updated", description: "Appointment status changed." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update appointment.", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  const events = appointments ?? [];

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground">Feb 3 – Feb 7, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="text-xs">Today</Button>
          <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          <div className="ml-2 flex rounded-lg border border-border p-0.5">
            <button onClick={() => setView("day")} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${view === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Day</button>
            <button onClick={() => setView("week")} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${view === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>Week</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border">
            <div className="p-3" />
            {(view === "week" ? days : [days[0]]).map((day) => (
              <div key={day} className="border-l border-border p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">{day}</p>
                <p className="text-lg font-semibold text-card-foreground">{days.indexOf(day) + 3}</p>
              </div>
            ))}
          </div>

          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border last:border-0">
              <div className="p-3 text-right">
                <span className="text-[11px] text-muted-foreground">{hour}</span>
              </div>
              {(view === "week" ? days : [days[0]]).map((_, dayIndex) => {
                const event = events.find((e: any) => e.day === dayIndex + 1 && e.time === hour);
                return (
                  <div key={dayIndex} className="border-l border-border p-1.5 min-h-[60px]">
                    {event && (
                      <div className={`flex items-center justify-between rounded-lg border p-2 text-xs ${statusStyles[event.status as keyof typeof statusStyles] ?? statusStyles.available}`}>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="opacity-70">{event.duration}m</p>
                        </div>
                        {event.status !== "available" && (
                          <button
                            className="rounded p-1 hover:bg-background/50"
                            onClick={() => rescheduleMutation.mutate({ id: String(event.id), status: event.status === "confirmed" ? "pending" : "confirmed" })}
                          >
                            {rescheduleMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
