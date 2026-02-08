import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export function GlassPanel({ children, className, glow, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl glass-panel shadow-card",
        glow && "shadow-glow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassPanelHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-b border-border/50 px-5 py-3.5 flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  );
}

export function GlassPanelContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}
