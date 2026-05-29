import { Swords, Compass, Gamepad2, Brain, Zap, GitBranch, Eye, Search, ShieldCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Visualizer", url: "/visualizer", icon: Eye },
  { title: "Searching Zone", url: "/searching", icon: Search },
  { title: "Battle Arena", url: "/battle", icon: Swords },
  { title: "Realms", url: "/realms", icon: Compass },
  { title: "Graph City", url: "/graph", icon: GitBranch },
  { title: "Practice", url: "/practice", icon: Gamepad2 },
  { title: "Profiler", url: "/profiler", icon: Brain },
  { title: "QA Validation", url: "/validation", icon: ShieldCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarContent>
        {/* Logo */}
        <div className={`px-4 py-5 flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <div className="p-1.5 rounded-md bg-primary/15 border border-primary/30 neon-glow-cyan">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-display text-sm font-bold tracking-wider neon-text-cyan">
              ALGOVIZ
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            Navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-body font-medium transition-colors duration-150 ${
                        isActive(item.url)
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "text-sidebar-foreground hover:bg-muted/50"
                      }`}
                      activeClassName=""
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
