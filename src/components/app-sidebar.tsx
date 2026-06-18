import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Sparkles,
  GitBranch,
  Code2,
  FileText,
  UserCircle2,
  LogOut,
  Wand2,
  Store,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "./logo";
import { useNavigate } from "@tanstack/react-router";

const items = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "AI Workspace", url: "/app/workspace", icon: Sparkles },
  { title: "AI Diagram Studio", url: "/app/studio", icon: Wand2 },
  { title: "Template Marketplace", url: "/app/marketplace", icon: Store },
  { title: "Marketplace Analytics", url: "/app/marketplace-analytics", icon: BarChart3 },
  { title: "Diagram Studio", url: "/app/diagrams", icon: GitBranch },
  { title: "Code Generator", url: "/app/generator", icon: Code2 },
  { title: "Documentation", url: "/app/docs", icon: FileText },
  { title: "Profile", url: "/app/profile", icon: UserCircle2 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">{collapsed ? <Logo withText={false} size={26} /> : <Logo />}</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url || (item.url !== "/app/dashboard" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url} className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-2 pb-4">
        {!collapsed && user && (
          <div className="mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs">
            <div className="font-medium text-sidebar-foreground">{user.displayName}</div>
            <div className="text-muted-foreground">{user.role}</div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                logout();
                navigate({ to: "/auth" });
              }}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
