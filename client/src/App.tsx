import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import EmployeesIndex from "@/pages/employees/index";
import EmployeeForm from "@/pages/employees/employee-form";
import EmployeeView from "@/pages/employees/employee-view";
import ServicePostsIndex from "@/pages/service-posts/index";
import ServicePostForm from "@/pages/service-posts/service-post-form";
import ServicePostView from "@/pages/service-posts/service-post-view";
import Allocation from "@/pages/allocation";
import OccurrencesIndex from "@/pages/occurrences/index";
import DocumentsIndex from "@/pages/documents/index";
import Reports from "@/pages/reports";
import Notifications from "@/pages/notifications/index";
import Admin from "@/pages/admin";
import Auditoria from "@/pages/auditoria";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/employees" component={EmployeesIndex} />
      <Route path="/employees/new" component={EmployeeForm} />
      <Route path="/employees/:id" component={EmployeeView} />
      <Route path="/employees/:id/edit" component={EmployeeForm} />
      <Route path="/service-posts" component={ServicePostsIndex} />
      <Route path="/service-posts/new" component={ServicePostForm} />
      <Route path="/service-posts/:id" component={ServicePostView} />
      <Route path="/service-posts/:id/edit" component={ServicePostForm} />
      <Route path="/allocation" component={Allocation} />
      <Route path="/occurrences" component={OccurrencesIndex} />
      <Route path="/documents" component={DocumentsIndex} />
      <Route path="/reports" component={Reports} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/admin" component={Admin} />
      <Route path="/auditoria" component={Auditoria} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-3 border-b bg-background sticky top-0 z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <AuthenticatedRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-md" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="gestao-contratual-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
