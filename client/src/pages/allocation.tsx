import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Save, Upload, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Employee, ServicePost, Allocation } from "@shared/schema";

const allocationStatuses = ["present", "absent", "justified", "vacation", "medical_leave"] as const;

export default function AllocationPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<string>("");
  const [editedAllocations, setEditedAllocations] = useState<Map<string, string>>(new Map());
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: servicePosts, isLoading: postsLoading } = useQuery<ServicePost[]>({
    queryKey: ["/api/service-posts"],
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDateStr = format(monthStart, "yyyy-MM-dd");
  const endDateStr = format(monthEnd, "yyyy-MM-dd");
  const currentMonthStr = format(currentDate, "yyyy-MM");
  const previousMonthDate = subMonths(currentDate, 1);
  const previousMonthStr = format(previousMonthDate, "yyyy-MM");

  const { data: allocations, isLoading: allocationsLoading } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations", { startDate: startDateStr, endDate: endDateStr }],
    queryFn: async () => {
      const res = await fetch(`/api/allocations?startDate=${startDateStr}&endDate=${endDateStr}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch allocations");
      }
      return res.json();
    },
  });

  const activeEmployees = useMemo(() => 
    employees?.filter(e => e.status === "active") || [],
    [employees]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPost) {
        throw new Error("Please select a service post first");
      }
      const updates = Array.from(editedAllocations.entries()).map(([key, status]) => {
        const [employeeId, date] = key.split("_");
        return {
          employeeId: parseInt(employeeId),
          postId: parseInt(selectedPost),
          date,
          status,
        };
      });

      for (const update of updates) {
        await apiRequest("POST", "/api/allocations", update);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      toast({ title: "Success", description: "Allocations saved successfully" });
      setEditedAllocations(new Map());
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save allocations", variant: "destructive" });
    },
  });

  const copyMonthMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPost) {
        throw new Error("Please select a service post first");
      }
      const response = await apiRequest("POST", "/api/allocations/copy-month", {
        sourceMonth: previousMonthStr,
        targetMonth: currentMonthStr,
        postId: selectedPost,
      });
      return response.json();
    },
    onSuccess: (data: { count: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      toast({ 
        title: "Success", 
        description: `Copied ${data.count} allocations from previous month` 
      });
      setCopyDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to copy allocations", 
        variant: "destructive" 
      });
    },
  });

  const csvImportMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedPost) {
        throw new Error("Please select a service post first");
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("postId", selectedPost);
      formData.append("month", currentMonthStr);

      const response = await fetch("/api/allocations/import-csv", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import CSV");
      }

      return response.json();
    },
    onSuccess: (data: { imported: number; errors?: string[] }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      let description = `Imported ${data.imported} allocations`;
      if (data.errors && data.errors.length > 0) {
        description += `. ${data.errors.length} rows had errors.`;
      }
      toast({ title: "Success", description });
      setCsvDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to import CSV", 
        variant: "destructive" 
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      csvImportMutation.mutate(file);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "employee_id,date,status\n1,2024-01-01,present\n2,2024-01-01,absent";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "allocation_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getAllocationStatus = (employeeId: number, date: Date): string | null => {
    const dateStr = format(date, "yyyy-MM-dd");
    const editKey = `${employeeId}_${dateStr}`;
    
    if (editedAllocations.has(editKey)) {
      return editedAllocations.get(editKey) || null;
    }
    
    const allocation = allocations?.find(
      a => a.employeeId === employeeId && a.date === dateStr
    );
    return allocation?.status || null;
  };

  const handleStatusChange = (employeeId: number, date: Date, status: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const key = `${employeeId}_${dateStr}`;
    setEditedAllocations(prev => new Map(prev).set(key, status));
  };

  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const isLoading = employeesLoading || postsLoading || allocationsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Allocation"
        description="Track employee attendance and allocations by service post"
      >
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && selectedPost && (
            <>
              <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-import-csv">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Allocations from CSV</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file with columns: employee_id, date, status.
                      Valid statuses: present, absent, justified, vacation, medical_leave.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="csv-file">CSV File</Label>
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        disabled={csvImportMutation.isPending}
                        data-testid="input-csv-file"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      data-testid="button-download-template"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCsvDialogOpen(false)}
                      data-testid="button-cancel-csv"
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-copy-month">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Previous Month
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Copy Previous Month's Allocations</DialogTitle>
                    <DialogDescription>
                      This will copy all allocations from {format(previousMonthDate, "MMMM yyyy")} to {format(currentDate, "MMMM yyyy")} for the selected service post.
                      Existing allocations for the current month will be replaced.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex-1 p-3 rounded-md bg-muted">
                        <div className="text-muted-foreground">From</div>
                        <div className="font-medium">{format(previousMonthDate, "MMMM yyyy")}</div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 p-3 rounded-md bg-muted">
                        <div className="text-muted-foreground">To</div>
                        <div className="font-medium">{format(currentDate, "MMMM yyyy")}</div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCopyDialogOpen(false)}
                      data-testid="button-cancel-copy"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => copyMonthMutation.mutate()}
                      disabled={copyMonthMutation.isPending}
                      data-testid="button-confirm-copy"
                    >
                      {copyMonthMutation.isPending ? "Copying..." : "Copy Allocations"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          {isAdmin && editedAllocations.size > 0 && (
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-allocations">
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : `Save Changes (${editedAllocations.size})`}
            </Button>
          )}
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth} data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="min-w-[180px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={nextMonth} data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Service Post:</span>
              <Select value={selectedPost} onValueChange={setSelectedPost}>
                <SelectTrigger className="w-[200px]" data-testid="select-service-post">
                  <SelectValue placeholder="Select a post" />
                </SelectTrigger>
                <SelectContent>
                  {servicePosts?.map((post) => (
                    <SelectItem key={post.id} value={post.id.toString()}>
                      {post.postCode} - {post.postName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedPost ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Select a service post to view and manage allocations</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activeEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No active employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 bg-background p-2 text-left text-sm font-medium min-w-[150px] z-10">
                      Employee
                    </th>
                    {daysInMonth.map((day) => (
                      <th
                        key={day.toISOString()}
                        className={`p-2 text-center text-xs font-medium min-w-[80px] ${
                          day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50" : ""
                        }`}
                      >
                        <div>{format(day, "EEE")}</div>
                        <div className="text-muted-foreground">{format(day, "d")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b" data-testid={`allocation-row-${employee.id}`}>
                      <td className="sticky left-0 bg-background p-2 z-10">
                        <div className="font-medium text-sm">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">{employee.functionPost}</div>
                      </td>
                      {daysInMonth.map((day) => {
                        const status = getAllocationStatus(employee.id, day);
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        return (
                          <td
                            key={day.toISOString()}
                            className={`p-1 text-center ${isWeekend ? "bg-muted/50" : ""}`}
                          >
                            {isAdmin ? (
                              <Select
                                value={status || ""}
                                onValueChange={(value) => handleStatusChange(employee.id, day, value)}
                              >
                                <SelectTrigger className="h-8 text-xs" data-testid={`select-allocation-${employee.id}-${format(day, "yyyy-MM-dd")}`}>
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allocationStatuses.map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs">
                                      {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : status ? (
                              <StatusBadge status={status as any} />
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {allocationStatuses.map((status) => (
              <div key={status} className="flex items-center gap-2">
                <StatusBadge status={status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
