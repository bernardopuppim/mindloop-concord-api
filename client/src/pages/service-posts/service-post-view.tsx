import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, Pencil, Users, FileText, UserPlus, ClipboardList, Plus, Trash2, Edit, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/authUtils";
import { translations } from "@/lib/translations";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ServicePost, Allocation, Document, Employee, ServiceActivity, InsertServiceActivity } from "@shared/types";

const activityFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  ppuUnit: z.string().min(1, "Unidade PPU é obrigatória"),
  frequency: z.enum(["daily", "weekly", "monthly", "on_demand"]),
  required: z.boolean(),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

const frequencyLabels: Record<string, string> = {
  daily: "Diária",
  weekly: "Semanal",
  monthly: "Mensal",
  on_demand: "Sob Demanda",
};

export default function ServicePostView() {
  const params = useParams<{ id: string }>();
  const postId = params.id ? parseInt(params.id, 10) : NaN;
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ServiceActivity | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<number | null>(null);

  const { data: servicePost, isLoading } = useQuery<ServicePost>({
    queryKey: ["/api/service-posts", postId],
    enabled: !isNaN(postId),
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: allocations } = useQuery<Allocation[]>({
    queryKey: ["/api/allocations"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: activities, isLoading: isLoadingActivities } = useQuery<ServiceActivity[]>({
    queryKey: ["/api/service-activities", { postId }],
    queryFn: async () => {
      const res = await fetch(`/api/service-activities?postId=${postId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    enabled: !isNaN(postId),
  });

  const activityForm = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      name: "",
      description: "",
      ppuUnit: "",
      frequency: "daily",
      required: true,
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const payload: InsertServiceActivity = {
        ...data,
        servicePostId: postId,
        description: data.description || null,
      };
      return apiRequest("POST", "/api/service-activities", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-activities", { postId }] });
      toast({ title: "Atividade criada com sucesso" });
      setIsActivityDialogOpen(false);
      activityForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar atividade", variant: "destructive" });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData & { id: number }) => {
      const { id, ...payload } = data;
      return apiRequest("PATCH", `/api/service-activities/${id}`, {
        ...payload,
        description: payload.description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-activities", { postId }] });
      toast({ title: "Atividade atualizada com sucesso" });
      setIsActivityDialogOpen(false);
      setEditingActivity(null);
      activityForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar atividade", variant: "destructive" });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/service-activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-activities", { postId }] });
      toast({ title: "Atividade excluída com sucesso" });
      setDeletingActivityId(null);
    },
    onError: () => {
      toast({ title: "Erro ao excluir atividade", variant: "destructive" });
    },
  });

  const handleOpenActivityDialog = (activity?: ServiceActivity) => {
    if (activity) {
      setEditingActivity(activity);
      activityForm.reset({
        name: activity.name,
        description: activity.description || "",
        ppuUnit: activity.ppuUnit,
        frequency: activity.frequency,
        required: activity.required,
      });
    } else {
      setEditingActivity(null);
      activityForm.reset({
        name: "",
        description: "",
        ppuUnit: "",
        frequency: "daily",
        required: true,
      });
    }
    setIsActivityDialogOpen(true);
  };

  const handleSubmitActivity = (data: ActivityFormData) => {
    if (editingActivity) {
      updateActivityMutation.mutate({ ...data, id: editingActivity.id });
    } else {
      createActivityMutation.mutate(data);
    }
  };

  const postDocuments = documents?.filter(d => d.postId === postId) || [];
  const postAllocations = allocations?.filter(a => a.postId === postId).slice(0, 10) || [];
  const linkedEmployees = employees?.filter(e => e.linkedPostId === postId) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={translations.common.loading} />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!servicePost) {
    return (
      <div className="space-y-6">
        <PageHeader title="Posto de Serviço Não Encontrado" />
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">O posto de serviço solicitado não foi encontrado.</p>
            <Button asChild className="mt-4">
              <Link href="/service-posts">{translations.common.back} {translations.servicePosts.title}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={servicePost.postName}
        description="Detalhes e alocações do posto de serviço"
      >
        <Button variant="outline" asChild data-testid="button-back">
          <Link href="/service-posts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translations.common.back}
          </Link>
        </Button>
        {isAdmin && (
          <Button asChild data-testid="button-edit">
            <Link href={`/service-posts/${postId}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              {translations.common.edit}
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Posto de Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.postCode}</p>
                <p className="text-base font-mono" data-testid="text-post-code">{servicePost.postCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.modality}</p>
                <div className="mt-1">
                  <StatusBadge status={servicePost.modality} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.postName}</p>
                <p className="text-base" data-testid="text-post-name">{servicePost.postName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.common.unit}</p>
                <p className="text-base" data-testid="text-post-unit">{servicePost.unit}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">{translations.common.description}</p>
                <p className="text-base" data-testid="text-post-description">
                  {servicePost.description || "Nenhuma descrição fornecida"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.createdAt}</p>
                <p className="text-base">{servicePost.createdAt ? formatDate(servicePost.createdAt) : "N/A"}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-4">Anexo 1A - Dados Contratuais</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.tipoPosto}</p>
                  <p className="text-base" data-testid="text-tipo-posto">{servicePost.tipoPosto || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.horarioTrabalho}</p>
                  <p className="text-base" data-testid="text-horario-trabalho">{servicePost.horarioTrabalho || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.escalaRegime}</p>
                  <p className="text-base" data-testid="text-escala-regime">{servicePost.escalaRegime || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{translations.servicePosts.quantidadePrevista}</p>
                  <p className="text-base" data-testid="text-quantidade-prevista">{servicePost.quantidadePrevista ?? "Não informado"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {translations.documents.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {postDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
            ) : (
              <div className="space-y-2">
                {postDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{doc.originalName}</span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
              <Link href={`/documents?postId=${postId}`}>Ver Todos os Documentos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Funcionários Vinculados
            <Badge variant="secondary" className="ml-2">{linkedEmployees.length}</Badge>
          </CardTitle>
          {isAdmin && (
            <Button size="sm" asChild data-testid="button-add-employee">
              <Link href={`/employees/new?linkedPostId=${postId}`}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Funcionário
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {linkedEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum funcionário vinculado a este posto</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {linkedEmployees.map((employee) => (
                <Link key={employee.id} href={`/employees/${employee.id}`}>
                  <div 
                    className="flex items-center justify-between rounded-md border p-3 hover-elevate cursor-pointer"
                    data-testid={`card-employee-${employee.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">{employee.functionPost}</p>
                    </div>
                    <StatusBadge status={employee.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alocações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {postAllocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma alocação encontrada para este posto</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {postAllocations.map((allocation) => (
                <div key={allocation.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{formatDate(allocation.date)}</p>
                    <p className="text-xs text-muted-foreground">ID Funcionário: {allocation.employeeId}</p>
                  </div>
                  <StatusBadge status={allocation.status} />
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/allocation">Ver Todas as Alocações</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Atividades do Posto
            <Badge variant="secondary" className="ml-2">{activities?.length || 0}</Badge>
          </CardTitle>
          {isAdmin && (
            <Button 
              size="sm" 
              onClick={() => handleOpenActivityDialog()}
              data-testid="button-add-activity"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingActivities ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : activities?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade configurada para este posto</p>
          ) : (
            <div className="space-y-3">
              {activities?.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between rounded-md border p-4"
                  data-testid={`card-activity-${activity.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{activity.name}</p>
                      {activity.required && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>Unidade PPU: {activity.ppuUnit}</span>
                      <span>Frequência: {frequencyLabels[activity.frequency]}</span>
                    </div>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{activity.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenActivityDialog(activity)}
                        data-testid={`button-edit-activity-${activity.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingActivityId(activity.id)}
                        data-testid={`button-delete-activity-${activity.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? "Editar Atividade" : "Nova Atividade"}
            </DialogTitle>
            <DialogDescription>
              {editingActivity 
                ? "Atualize os dados da atividade do posto." 
                : "Configure uma nova atividade para este posto de serviço."}
            </DialogDescription>
          </DialogHeader>
          <Form {...activityForm}>
            <form onSubmit={activityForm.handleSubmit(handleSubmitActivity)} className="space-y-4">
              <FormField
                control={activityForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Atividade</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Limpeza de vidros" 
                        {...field}
                        data-testid="input-activity-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={activityForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição da atividade..."
                        className="resize-none"
                        {...field}
                        data-testid="input-activity-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={activityForm.control}
                name="ppuUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade PPU</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: m², unidade, litro" 
                        {...field}
                        data-testid="input-activity-ppu-unit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={activityForm.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-activity-frequency">
                          <SelectValue placeholder="Selecione a frequência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="on_demand">Sob Demanda</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={activityForm.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Atividade Obrigatória</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Marque se esta atividade deve ser executada regularmente
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-activity-required"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsActivityDialogOpen(false)}
                  data-testid="button-activity-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
                  data-testid="button-activity-submit"
                >
                  {createActivityMutation.isPending || updateActivityMutation.isPending 
                    ? "Salvando..." 
                    : editingActivity ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingActivityId !== null} onOpenChange={() => setDeletingActivityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita
              e irá remover todas as execuções associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-activity-cancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingActivityId && deleteActivityMutation.mutate(deletingActivityId)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-delete-activity-confirm"
            >
              {deleteActivityMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
