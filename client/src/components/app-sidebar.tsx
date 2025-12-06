import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  AlertCircle,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { translations } from "@/lib/translations";
import { DicaLogo } from "@/components/dica-logo";

const mainNavItems = [
  {
    title: translations.nav.dashboard,
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: translations.nav.employees,
    url: "/employees",
    icon: Users,
  },
  {
    title: translations.nav.servicePosts,
    url: "/service-posts",
    icon: Briefcase,
  },
  {
    title: translations.nav.allocation,
    url: "/allocation",
    icon: CalendarDays,
  },
  {
    title: translations.nav.feriasLicencas,
    url: "/ferias-licencas",
    icon: CalendarCheck,
  },
  {
    title: translations.nav.occurrences,
    url: "/occurrences",
    icon: AlertCircle,
  },
  {
    title: translations.nav.documents,
    url: "/documents",
    icon: FileText,
  },
  {
    title: translations.nav.alerts,
    url: "/alerts",
    icon: AlertTriangle,
  },
];

const adminNavItems = [
  {
    title: translations.nav.reports,
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: translations.nav.notifications,
    url: "/notifications",
    icon: Bell,
  },
  {
    title: "Auditoria",
    url: "/auditoria",
    icon: ClipboardList,
  },
  {
    title: "Logs LGPD",
    url: "/lgpd-logs",
    icon: ShieldCheck,
  },
  {
    title: translations.nav.adminSettings,
    url: "/admin",
    icon: Settings,
  },
];

function getRoleLabel(role?: string): string {
  switch (role) {
    case "admin":
      return translations.roles.admin;
    case "admin_dica":
      return translations.roles.adminDica;
    case "operator_dica":
      return translations.roles.operatorDica;
    case "fiscal_petrobras":
      return translations.roles.fiscalPetrobras;
    case "viewer":
      return translations.roles.viewer;
    default:
      return translations.roles.viewer;
  }
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAdmin, userRole } = useAuth();

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const canViewAdminItems = isAdmin || userRole === "admin_dica" || userRole === "operator_dica";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <DicaLogo className="h-10 w-10" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{translations.branding.appName}</span>
            <span className="text-xs text-muted-foreground">{translations.branding.companyName}</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{translations.nav.mainMenu}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || (item.url !== "/" && location.startsWith(item.url))}
                  >
                    <Link href={item.url} data-testid={`link-nav-${item.url.replace(/\//g, '') || 'dashboard'}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-4" />

        {canViewAdminItems && (
          <SidebarGroup>
            <SidebarGroupLabel>{translations.nav.administration}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url || location.startsWith(item.url)}
                    >
                      <Link href={item.url} data-testid={`link-nav-${item.url.replace(/\//g, '')}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
            <AvatarFallback className="text-xs">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">
              {user?.firstName || user?.email || "Usuário"}
            </span>
            <Badge variant="secondary" className="w-fit text-xs">
              {getRoleLabel(userRole)}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            asChild
            data-testid="button-logout"
          >
            <a href="/api/logout">
              <LogOut className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
