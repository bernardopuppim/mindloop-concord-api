import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Save, FileText, Paperclip, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ServicePost, ServiceActivity, ActivityExecution, ActivityExecutionAttachment, Employee } from "@shared/schema";

const frequencyLabels: Record<string, string> = {
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal",
  on_demand: "Sob Demanda",
};

interface ExecutionDialogData {
  activityId: number;
  activityName: string;
  date: string;
  existingExecution?: ActivityExecution;
}

interface AttachmentsDialogData {
  executionId: number;
  activityName: string;
}

export default function ActivityExecutionsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<string>("");
  const [executionDialog, setExecutionDialog] = useState<ExecutionDialogData | null>(null);
  const [attachmentsDialog, setAttachmentsDialog] = useState<AttachmentsDialogData | null>(null);
  const [executionQuantity, setExecutionQuantity] = useState<number>(1);
  const [executionNotes, setExecutionNotes] = useState<string>("");
  const [executionEmployeeId, setExecutionEmployeeId] = useState<string>("");

  const { data: servicePosts, isLoading: postsLoading } = useQuery<ServicePost[]>({
    queryKey: ["/api/service-posts"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const activeEmployees = useMemo(() =>
    employees?.filter(e => e.status === "active") || [],
    [employees]
  );

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDateStr = format(monthStart, "yyyy-MM-dd");
  const endDateStr = format(monthEnd, "yyyy-MM-dd");

  const { data: activities, isLoading: activitiesLoading } = useQuery<ServiceActivity[]>({
    queryKey: ["/api/service-activities", { postId: selectedPost }],
    queryFn: async () => {
      const res = await fetch(`/api/service-activities?postId=${selectedPost}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar atividades");
      return res.json();
    },
    enabled: !!selectedPost,
  });

  const { data: executions, isLoading: executionsLoading } = useQuery<ActivityExecution[]>({
    queryKey: ["/api/activity-executions", { servicePostId: selectedPost, startDate: startDateStr, endDate: endDateStr }],
    queryFn: async () => {
      const res = await fetch(
        `/api/activity-executions?servicePostId=${selectedPost}&startDate=${startDateStr}&endDate=${endDateStr}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Erro ao carregar execuções");
      return res.json();
    },
    enabled: !!selectedPost,
  });

  const { data: attachments } = useQuery<ActivityExecutionAttachment[]>({
    queryKey: ["/api/activity-executions", attachmentsDialog?.executionId, "attachments"],
    queryFn: async () => {
      if (!attachmentsDialog) return [];
      const res = await fetch(`/api/activity-executions/${attachmentsDialog.executionId}/attachments`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar anexos");
      return res.json();
    },
    enabled: !!attachmentsDialog?.executionId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { 
      serviceActivityId: number; 
      servicePostId: number; 
      date: string; 
      quantity: number; 
      notes: string | null;
      employeeId: number | null;
      existingId?: number;
    }) => {
      if (data.existingId) {
        return apiRequest("PATCH", `/api/activity-executions/${data.existingId}`, {
          quantity: data.quantity,
          notes: data.notes,
          employeeId: data.employeeId,
        });
      } else {
        return apiRequest("POST", "/api/activity-executions", {
          serviceActivityId: data.serviceActivityId,
          servicePostId: data.servicePostId,
          date: data.date,
          quantity: data.quantity,
          notes: data.notes,
          employeeId: data.employeeId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-executions"] });
      toast({ title: "Execução salva com sucesso" });
      setExecutionDialog(null);
      setExecutionQuantity(1);
      setExecutionNotes("");
      setExecutionEmployeeId("");
    },
    onError: () => {
      toast({ title: "Erro ao salvar execução", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/activity-executions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-executions"] });
      toast({ title: "Execução excluída com sucesso" });
      setExecutionDialog(null);
    },
    onError: () => {
      toast({ title: "Erro ao excluir execução", variant: "destructive" });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ executionId, file }: { executionId: number; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/activity-executions/${executionId}/attachments`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("Erro ao fazer upload");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-executions", attachmentsDialog?.executionId, "attachments"] });
      toast({ title: "Arquivo anexado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao anexar arquivo", variant: "destructive" });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/activity-execution-attachments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-executions", attachmentsDialog?.executionId, "attachments"] });
      toast({ title: "Anexo excluído com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir anexo", variant: "destructive" });
    },
  });

  const getExecution = (activityId: number, date: Date): ActivityExecution | undefined => {
    const dateStr = format(date, "yyyy-MM-dd");
    return executions?.find(
      e => e.serviceActivityId === activityId && e.date === dateStr
    );
  };

  const openExecutionDialog = (activity: ServiceActivity, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = getExecution(activity.id, date);
    setExecutionDialog({
      activityId: activity.id,
      activityName: activity.name,
      date: dateStr,
      existingExecution: existing,
    });
    setExecutionQuantity(existing?.quantity || 1);
    setExecutionNotes(existing?.notes || "");
    setExecutionEmployeeId(existing?.employeeId?.toString() || "");
  };

  const handleSaveExecution = () => {
    if (!executionDialog || !selectedPost) return;
    saveMutation.mutate({
      serviceActivityId: executionDialog.activityId,
      servicePostId: parseInt(selectedPost),
      date: executionDialog.date,
      quantity: executionQuantity,
      notes: executionNotes || null,
      employeeId: executionEmployeeId ? parseInt(executionEmployeeId) : null,
      existingId: executionDialog.existingExecution?.id,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && attachmentsDialog) {
      uploadAttachmentMutation.mutate({ executionId: attachmentsDialog.executionId, file });
      event.target.value = "";
    }
  };

  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const isLoading = postsLoading || activitiesLoading || executionsLoading;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Execuções de Atividades"
        description="Registre e acompanhe a execução das atividades configuradas para cada posto de serviço"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth} data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="min-w-[180px] text-center capitalize">
                {format(currentDate, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={nextMonth} data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Posto de Serviço:</span>
              <Select value={selectedPost} onValueChange={setSelectedPost}>
                <SelectTrigger className="w-[250px]" data-testid="select-service-post">
                  <SelectValue placeholder="Selecione um posto" />
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
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecione um posto de serviço para visualizar as atividades</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !activities || activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma atividade configurada para este posto</p>
              <p className="text-sm text-muted-foreground mt-2">
                Configure as atividades na página do posto de serviço
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 bg-background p-2 text-left text-sm font-medium min-w-[200px] z-10">
                      Atividade
                    </th>
                    {daysInMonth.map((day) => (
                      <th
                        key={day.toISOString()}
                        className={`p-2 text-center text-xs font-medium min-w-[50px] ${
                          day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50" : ""
                        }`}
                      >
                        <div>{format(day, "EEE", { locale: ptBR })}</div>
                        <div className="text-muted-foreground">{format(day, "d")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className="border-b" data-testid={`activity-row-${activity.id}`}>
                      <td className="sticky left-0 bg-background p-2 z-10">
                        <div className="font-medium text-sm">{activity.name}</div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {frequencyLabels[activity.frequency]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{activity.ppuUnit}</span>
                        </div>
                      </td>
                      {daysInMonth.map((day) => {
                        const execution = getExecution(activity.id, day);
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        return (
                          <td
                            key={day.toISOString()}
                            className={`p-1 text-center ${isWeekend ? "bg-muted/50" : ""}`}
                          >
                            <Button
                              variant={execution ? "secondary" : "ghost"}
                              size="sm"
                              className="h-8 w-full text-xs"
                              onClick={() => openExecutionDialog(activity, day)}
                              data-testid={`cell-${activity.id}-${format(day, "yyyy-MM-dd")}`}
                            >
                              {execution ? execution.quantity : "-"}
                            </Button>
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

      <Dialog open={!!executionDialog} onOpenChange={(open) => !open && setExecutionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {executionDialog?.existingExecution ? "Editar Execução" : "Registrar Execução"}
            </DialogTitle>
            <DialogDescription>
              {executionDialog?.activityName} - {executionDialog?.date && format(new Date(executionDialog.date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                value={executionQuantity}
                onChange={(e) => setExecutionQuantity(parseInt(e.target.value) || 0)}
                data-testid="input-execution-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário Responsável (opcional)</Label>
              <Select value={executionEmployeeId} onValueChange={setExecutionEmployeeId}>
                <SelectTrigger data-testid="select-execution-employee">
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {activeEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={executionNotes}
                onChange={(e) => setExecutionNotes(e.target.value)}
                placeholder="Observações sobre a execução..."
                className="resize-none"
                data-testid="input-execution-notes"
              />
            </div>
            {executionDialog?.existingExecution && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAttachmentsDialog({
                    executionId: executionDialog.existingExecution!.id,
                    activityName: executionDialog.activityName,
                  })}
                  data-testid="button-manage-attachments"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Gerenciar Anexos
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {executionDialog?.existingExecution && isAdmin && (
              <Button
                variant="destructive"
                onClick={() => executionDialog.existingExecution && deleteMutation.mutate(executionDialog.existingExecution.id)}
                disabled={deleteMutation.isPending}
                data-testid="button-delete-execution"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setExecutionDialog(null)}
              data-testid="button-cancel-execution"
            >
              Cancelar
            </Button>
            {isAdmin && (
              <Button
                onClick={handleSaveExecution}
                disabled={saveMutation.isPending}
                data-testid="button-save-execution"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!attachmentsDialog} onOpenChange={(open) => !open && setAttachmentsDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Anexos da Execução</DialogTitle>
            <DialogDescription>
              {attachmentsDialog?.activityName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadAttachmentMutation.isPending}
                  data-testid="input-upload-attachment"
                />
              </div>
            )}
            {!attachments || attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum anexo encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-md border p-3"
                    data-testid={`attachment-${attachment.id}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{attachment.fileName}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        data-testid={`button-download-${attachment.id}`}
                      >
                        <a
                          href={`/api/activity-execution-attachments/${attachment.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                          disabled={deleteAttachmentMutation.isPending}
                          data-testid={`button-delete-attachment-${attachment.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAttachmentsDialog(null)}
              data-testid="button-close-attachments"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
