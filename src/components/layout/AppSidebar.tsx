import {
  LayoutDashboard,
  Phone,
  CalendarDays,
  FileText,
  Settings,
  Brain,
  Headphones,
  GitBranch,
  Zap,
  Hand,
  Mic,
  Play,
  Network,
  AlertOctagon,
  FlaskConical,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const coreNav = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Live Call", url: "/live-call", icon: Phone },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Call Logs", url: "/call-logs", icon: FileText },
];

const intelligenceNav = [
  { title: "Agent Thinking", url: "/agent-thinking", icon: GitBranch },
  { title: "Simulator & Trust", url: "/simulator", icon: Zap },
  { title: "Human Override", url: "/human-loop", icon: Hand },
  { title: "Voice Lab", url: "/voice-lab", icon: Mic },
  { title: "Replay Studio", url: "/replay", icon: Play },
  { title: "Memory Map", url: "/memory-map", icon: Network },
  { title: "Failure Forensics", url: "/forensics", icon: AlertOctagon },
  { title: "Experiments", url: "/experiments", icon: FlaskConical },
];

const configNav = [
  { title: "Agent Settings", url: "/settings", icon: Settings },
  { title: "Preferences", url: "/preferences", icon: Brain },
];

function NavGroup({ label, items }: { label: string; items: typeof coreNav }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  activeClassName="bg-accent text-accent-foreground font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary shadow-glow">
            <Headphones className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">CallPilot</span>
              <span className="text-[10px] text-muted-foreground">Agent Intelligence Console</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Core" items={coreNav} />
        <NavGroup label="Intelligence" items={intelligenceNav} />
        <NavGroup label="Config" items={configNav} />
      </SidebarContent>
    </Sidebar>
  );
}
