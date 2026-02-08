import { useState } from "react";
import { X, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCallLogs } from "@/lib/dataService";

const statusBadge: Record<string, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
  neutral: "bg-muted text-muted-foreground border-border",
};

export default function CallLogs() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["call_logs"],
    queryFn: fetchCallLogs,
  });

  const filteredLogs = (logs || []).filter((l: any) =>
    l.caller_name.toLowerCase().includes(search.toLowerCase()) ||
    l.intent.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLog = filteredLogs.find((l: any) => l.id === selected);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Call Logs</h1>
        <p className="text-sm text-muted-foreground">Review past calls and transcripts</p>
      </div>

      <div className="flex gap-6">
        <div className={`flex-1 min-w-0 space-y-4 ${selected ? "hidden lg:block" : ""}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search calls..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filteredLogs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 shadow-card text-center">
              <p className="text-sm text-muted-foreground">No call logs found.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-3 font-medium text-muted-foreground">Caller</th>
                    <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">Intent</th>
                    <th className="p-3 font-medium text-muted-foreground">Outcome</th>
                    <th className="p-3 font-medium text-muted-foreground hidden md:table-cell">Duration</th>
                    <th className="p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log: any) => (
                    <tr key={log.id} onClick={() => setSelected(log.id)}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${selected === log.id ? "bg-accent/50" : ""}`}>
                      <td className="p-3">
                        <p className="font-medium text-card-foreground">{log.caller_name}</p>
                        <p className="text-xs text-muted-foreground">{log.date}</p>
                      </td>
                      <td className="p-3 hidden sm:table-cell text-muted-foreground">{log.intent}</td>
                      <td className="p-3 text-card-foreground">{log.outcome}</td>
                      <td className="p-3 hidden md:table-cell font-mono text-xs text-muted-foreground">{log.duration}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[11px] ${statusBadge[log.status] || statusBadge.neutral}`}>
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedLog && (
          <div className="w-full lg:w-96 shrink-0 rounded-xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-semibold text-card-foreground">{selectedLog.caller_name}</h3>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 hover:bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                <p className="text-sm text-card-foreground">{selectedLog.summary}</p>
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-mono font-medium text-card-foreground">{selectedLog.duration}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Intent</p>
                  <p className="font-medium text-card-foreground">{selectedLog.intent}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Outcome</p>
                  <p className="font-medium text-card-foreground">{selectedLog.outcome}</p>
                </div>
              </div>
              {selectedLog.transcript && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Transcript</p>
                  <div className="rounded-lg bg-muted p-3 font-mono text-xs text-muted-foreground whitespace-pre-wrap max-h-64 overflow-auto">
                    {selectedLog.transcript}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
