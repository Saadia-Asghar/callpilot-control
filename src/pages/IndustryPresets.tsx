import { useState } from "react";
import { Building2, Scissors, GraduationCap, School, Check, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const presets = [
  {
    id: "clinic",
    name: "Clinic",
    icon: Building2,
    color: "bg-chart-1/15 text-chart-1 border-chart-1/30",
    slotDuration: 30,
    bufferTime: 15,
    questions: ["Reason for visit", "Insurance provider", "Preferred doctor", "Allergies"],
    script: "Thank you for calling. How may I assist you with your appointment today?",
  },
  {
    id: "salon",
    name: "Salon",
    icon: Scissors,
    color: "bg-chart-3/15 text-chart-3 border-chart-3/30",
    slotDuration: 45,
    bufferTime: 10,
    questions: ["Service requested", "Preferred stylist", "Any allergies or sensitivities"],
    script: "Hi! Welcome to our salon booking line. What service are you looking for?",
  },
  {
    id: "tutor",
    name: "Tutor",
    icon: GraduationCap,
    color: "bg-chart-2/15 text-chart-2 border-chart-2/30",
    slotDuration: 60,
    bufferTime: 15,
    questions: ["Subject", "Current level", "Preferred schedule", "Learning goals"],
    script: "Hello! I'd love to help set up a tutoring session. What subject do you need help with?",
  },
  {
    id: "university",
    name: "University",
    icon: School,
    color: "bg-chart-4/15 text-chart-4 border-chart-4/30",
    slotDuration: 20,
    bufferTime: 5,
    questions: ["Department", "Program of interest", "Student ID (if applicable)", "Inquiry type"],
    script: "Thank you for calling admissions. How can I help you today?",
  },
];

export default function IndustryPresets() {
  const [activePreset, setActivePreset] = useState("clinic");
  const { toast } = useToast();

  const handleApply = (name: string) => {
    setActivePreset(name.toLowerCase());
    toast({ title: "Preset Applied", description: `${name} preset is now active for new calls.` });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Industry Presets</h1>
          <p className="text-sm text-muted-foreground">Configure default settings by industry</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {presets.map((preset, i) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl border bg-card p-5 shadow-card transition-all hover:shadow-elevated ${
              activePreset === preset.id ? "border-primary ring-1 ring-primary/20" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${preset.color}`}>
                  <preset.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{preset.name}</h3>
                  <p className="text-xs text-muted-foreground">{preset.slotDuration}min slots · {preset.bufferTime}min buffer</p>
                </div>
              </div>
              {activePreset === preset.id && (
                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                  <Check className="h-3 w-3 mr-0.5" /> Active
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Intake Questions</p>
                <div className="flex flex-wrap gap-1">
                  {preset.questions.map((q) => (
                    <Badge key={q} variant="outline" className="text-[10px] font-normal">{q}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Script Preview</p>
                <p className="text-xs text-card-foreground italic">"{preset.script}"</p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 text-xs gradient-primary text-primary-foreground border-0" onClick={() => handleApply(preset.name)}>
                  Apply Preset
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
