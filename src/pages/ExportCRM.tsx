import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Send, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const exports = [
  { id: "e1", name: "Weekly Call Summary", format: "CSV", date: "Feb 7, 2026", rows: 156 },
  { id: "e2", name: "Intake Data — Clinic", format: "JSON", date: "Feb 6, 2026", rows: 42 },
  { id: "e3", name: "Recovery Report", format: "CSV", date: "Feb 5, 2026", rows: 18 },
];

export default function ExportCRM() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = (format: string) => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      toast({ title: "✅ Export Ready", description: `${format} file generated and ready for download.` });
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <Download className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Export & CRM</h1>
          <p className="text-sm text-muted-foreground">Export structured intake and call data</p>
        </div>
      </div>

      {/* Export Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Export JSON", icon: FileJson, format: "JSON", desc: "Structured intake data" },
          { label: "Export CSV", icon: FileSpreadsheet, format: "CSV", desc: "Spreadsheet compatible" },
          { label: "Push to CRM", icon: Send, format: "CRM", desc: "HubSpot / Salesforce ready" },
        ].map((action) => (
          <motion.button
            key={action.format}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated text-center"
            onClick={() => handleExport(action.format)}
            disabled={exporting}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-accent">
              <action.icon className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Past Exports */}
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-card-foreground">Recent Exports</h3>
        </div>
        <div className="divide-y divide-border">
          {exports.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{exp.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {exp.date} · {exp.rows} rows
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">{exp.format}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
