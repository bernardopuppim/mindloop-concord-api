import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Users, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/authUtils";
import type { User, AuditLog } from "@shared/schema";

export default function AdminPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "User role updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    },
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Settings" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Access Denied</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You do not have permission to access admin settings. Contact an administrator for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (firstName?: string | null, lastName?: string | null, email?: string | null) => {
    if (firstName || lastName) {
      return ((firstName?.charAt(0) || "") + (lastName?.charAt(0) || "")).toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Settings"
        description="Manage users and view system activity"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            ) : (
              <div className="space-y-4">
                {users?.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 rounded-md border p-3" data-testid={`user-row-${user.id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImageUrl || undefined} className="object-cover" />
                      <AvatarFallback>{getInitials(user.firstName, user.lastName, user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.firstName || user.lastName 
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : user.email || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Select
                      value={user.role}
                      onValueChange={(role) => updateRoleMutation.mutate({ userId: user.id, role })}
                      disabled={user.id === currentUser?.id || updateRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-[100px]" data-testid={`select-role-${user.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Stats
            </CardTitle>
            <CardDescription>Overview of system activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Users</span>
                </div>
                <p className="mt-2 text-2xl font-semibold">{users?.length || 0}</p>
              </div>
              <div className="rounded-md border p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Admins</span>
                </div>
                <p className="mt-2 text-2xl font-semibold">{users?.filter(u => u.role === "admin").length || 0}</p>
              </div>
              <div className="rounded-md border p-4 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Audit Log Entries</span>
                </div>
                <p className="mt-2 text-2xl font-semibold">{auditLogs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <CardDescription>Recent system activity and changes</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : auditLogs?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No audit log entries</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs?.slice(0, 20).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {log.timestamp ? formatDateTime(log.timestamp) : "-"}
                      </TableCell>
                      <TableCell className="text-sm">{log.userId || "System"}</TableCell>
                      <TableCell>
                        <Badge variant={
                          log.action === "CREATE" ? "default" :
                          log.action === "UPDATE" ? "secondary" :
                          log.action === "DELETE" ? "destructive" : "outline"
                        }>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.entityType}</TableCell>
                      <TableCell className="text-sm font-mono">{log.entityId || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {auditLogs && auditLogs.length > 20 && (
                <p className="text-sm text-muted-foreground mt-2">Showing 20 of {auditLogs.length} entries</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
