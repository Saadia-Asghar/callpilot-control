import { useState } from "react";
import { Star, MessageSquare, BarChart3, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const pastFeedback = [
  { id: 1, call: "Sarah Chen", rating: 5, comment: "Excellent — booked in under 2 min." },
  { id: 2, call: "James Park", rating: 4, comment: "Good reschedule, slight pause at confirmation." },
  { id: 3, call: "Tom Wilson", rating: 3, comment: "Cancellation handled, but felt robotic." },
  { id: 4, call: "Maria Lopez", rating: 5, comment: "" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= value ? "fill-warning text-warning" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const avgRating = (pastFeedback.reduce((sum, f) => sum + f.rating, 0) / pastFeedback.length).toFixed(1);

  const handleSubmit = () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    toast({ title: "✅ Feedback Saved", description: `Rating: ${rating}/5. Thank you!` });
    setRating(0);
    setComment("");
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <MessageSquare className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Feedback & Rating</h1>
          <p className="text-sm text-muted-foreground">Rate AI responses and leave comments</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Submit feedback */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Rate Last Call</h3>
          <div className="space-y-4">
            <StarRating value={rating} onChange={setRating} />
            <Textarea
              placeholder="Optional feedback…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <Button className="gap-1.5 gradient-primary text-primary-foreground border-0" onClick={handleSubmit}>
              <Send className="h-3.5 w-3.5" /> Submit Feedback
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Feedback Overview</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent">
              <span className="text-2xl font-bold text-accent-foreground">{avgRating}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">Average Rating</p>
              <p className="text-xs text-muted-foreground">{pastFeedback.length} total reviews</p>
            </div>
          </div>

          <div className="space-y-2">
            {pastFeedback.map((fb) => (
              <motion.div
                key={fb.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
              >
                <div className="flex gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3 w-3 ${s <= fb.rating ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-card-foreground">{fb.call}</p>
                  {fb.comment && <p className="text-[11px] text-muted-foreground">{fb.comment}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
