import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Mail, Plus, Trash2, Send, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { translations } from "@/lib/translations";
import type { NotificationSettings } from "@shared/types";

interface NotificationStatus {
  emailServiceConfigured: boolean;
  smtpConfigured: boolean;
}

export default function NotificationsPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const { data: settings, isLoading: settingsLoading } = useQuery<NotificationSettings[]>({
    queryKey: ["/api/notification-settings"],
    enabled: isAdmin === true,
  });

  const { data: status, isLoading: statusLoading } = useQuery<NotificationStatus>({
    queryKey: ["/api/notifications/status"],
    enabled: isAdmin === true,
  });

  const createMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/notification-settings", { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      toast({ title: translations.common.success, description: translations.notifications.recipientAdded });
      setAddDialogOpen(false);
      setNewEmail("");
    },
    onError: (error: any) => {
      toast({
        title: translations.common.error,
        description: error?.message || translations.notifications.addRecipientFailed,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<NotificationSettings>) => {
      await apiRequest("PATCH", `/api/notification-settings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      toast({ title: translations.common.success, description: translations.notifications.settingsSaved });
    },
    onError: () => {
      toast({ title: translations.common.error, description: translations.errors.saveError, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notification-settings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      toast({ title: translations.common.success, description: translations.notifications.recipientRemoved });
    },
    onError: () => {
      toast({ title: translations.common.error, description: translations.errors.deleteError, variant: "destructive" });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/notifications/test", { email });
    },
    onSuccess: () => {
      toast({ title: translations.common.success, description: translations.notifications.emailSent });
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: translations.common.error,
        description: error?.message || translations.notifications.testEmailFailed,
        variant: "destructive",
      });
    },
  });

  const sendDocExpirationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/send-document-expiration");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: translations.common.success,
        description: translations.notifications.documentExpirationSent.replace("{count}", String(data.sentCount || 0)),
      });
    },
    onError: () => {
      toast({ title: translations.common.error, description: translations.notifications.documentExpirationFailed, variant: "destructive" });
    },
  });

  const sendDailySummaryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/send-daily-summary");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: translations.common.success,
        description: translations.notifications.dailySummarySent.replace("{count}", String(data.sentCount || 0)),
      });
    },
    onError: () => {
      toast({ title: translations.common.error, description: translations.notifications.dailySummaryFailed, variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title={translations.notifications.title} />
        <Card>
          <CardContent className="py-12">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title={translations.notifications.title} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">{translations.auth.accessDenied}</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {translations.auth.permissionRequired}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emailServiceConfigured = status?.emailServiceConfigured === true;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={translations.notifications.title}
        description={translations.notifications.description}
      >
        {isAdmin && emailServiceConfigured && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-recipient">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Destinatário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Destinatário de Notificação</DialogTitle>
                <DialogDescription>
                  Adicione um endereço de email para receber notificações do sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{translations.notifications.emailAddress}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="destinatario@exemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    data-testid="input-new-email"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  data-testid="button-cancel-add"
                >
                  {translations.common.cancel}
                </Button>
                <Button
                  onClick={() => createMutation.mutate(newEmail)}
                  disabled={!newEmail || createMutation.isPending}
                  data-testid="button-confirm-add"
                >
                  Adicionar Destinatário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Status do Serviço de Email
          </CardTitle>
          <CardDescription>Status da configuração do serviço de email</CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-md border">
              {emailServiceConfigured ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-700 dark:text-green-400">Serviço de Email Configurado</p>
                    <p className="text-sm text-muted-foreground">Conexão SMTP pronta para enviar emails</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-700 dark:text-amber-400">Serviço de Email Não Configurado</p>
                    <p className="text-sm text-muted-foreground">Credenciais SMTP ausentes ou inválidas</p>
                  </div>
                </>
              )}
            </div>
          )}

          {!emailServiceConfigured && (
            <div className="mt-4 p-4 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">Configuração SMTP Necessária</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Para habilitar notificações por email, configure as seguintes variáveis de ambiente:
                  </p>
                  <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1">
                    <li>SMTP_HOST - Hostname do servidor SMTP</li>
                    <li>SMTP_PORT - Porta do servidor SMTP (geralmente 587 ou 465)</li>
                    <li>SMTP_USER - Usuário de autenticação SMTP</li>
                    <li>SMTP_PASS - Senha de autenticação SMTP</li>
                    <li>SMTP_FROM (opcional) - Endereço de email do remetente</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {emailServiceConfigured && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  {translations.notifications.testEmail}
                </CardTitle>
                <CardDescription>Teste a configuração de email enviando um email de teste</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-email">{translations.notifications.emailAddress}</Label>
                    <Input
                      id="test-email"
                      type="email"
                      placeholder="teste@exemplo.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      data-testid="input-test-email"
                    />
                  </div>
                  <Button
                    onClick={() => testEmailMutation.mutate(testEmail)}
                    disabled={!testEmail || testEmailMutation.isPending}
                    data-testid="button-send-test"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Email de Teste
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações Manuais
                </CardTitle>
                <CardDescription>Disparar emails de notificação manualmente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => sendDocExpirationMutation.mutate()}
                    disabled={sendDocExpirationMutation.isPending}
                    data-testid="button-send-doc-expiration"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Enviar Alertas de Vencimento de Documentos
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => sendDailySummaryMutation.mutate()}
                    disabled={sendDailySummaryMutation.isPending}
                    data-testid="button-send-daily-summary"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Enviar Resumo Diário
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Destinatários de Notificação
              </CardTitle>
              <CardDescription>Gerencie quem recebe notificações por email e quais tipos</CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : settings?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{translations.notifications.noPendingNotifications}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Adicionar Destinatário" para adicionar um endereço de email
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">{translations.notifications.isActive}</TableHead>
                        <TableHead className="text-center">{translations.notifications.notifyNewOccurrences}</TableHead>
                        <TableHead className="text-center">{translations.notifications.notifyMissingAllocations}</TableHead>
                        <TableHead className="text-center">{translations.notifications.notifyDocumentExpiration}</TableHead>
                        <TableHead className="text-center">{translations.notifications.notifyDailySummary}</TableHead>
                        <TableHead className="w-[80px]">{translations.common.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settings?.map((setting) => (
                        <TableRow key={setting.id} data-testid={`row-notification-${setting.id}`}>
                          <TableCell className="font-medium">{setting.email}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={setting.isActive}
                              onCheckedChange={(checked) =>
                                updateMutation.mutate({ id: setting.id, isActive: checked })
                              }
                              disabled={updateMutation.isPending}
                              data-testid={`switch-active-${setting.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={setting.notifyNewOccurrences}
                              onCheckedChange={(checked) =>
                                updateMutation.mutate({ id: setting.id, notifyNewOccurrences: checked })
                              }
                              disabled={updateMutation.isPending || !setting.isActive}
                              data-testid={`switch-occurrences-${setting.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={setting.notifyMissingAllocations}
                              onCheckedChange={(checked) =>
                                updateMutation.mutate({ id: setting.id, notifyMissingAllocations: checked })
                              }
                              disabled={updateMutation.isPending || !setting.isActive}
                              data-testid={`switch-allocations-${setting.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={setting.notifyDocumentExpiration}
                              onCheckedChange={(checked) =>
                                updateMutation.mutate({ id: setting.id, notifyDocumentExpiration: checked })
                              }
                              disabled={updateMutation.isPending || !setting.isActive}
                              data-testid={`switch-doc-expiration-${setting.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={setting.notifyDailySummary}
                              onCheckedChange={(checked) =>
                                updateMutation.mutate({ id: setting.id, notifyDailySummary: checked })
                              }
                              disabled={updateMutation.isPending || !setting.isActive}
                              data-testid={`switch-daily-summary-${setting.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  data-testid={`button-delete-${setting.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover Destinatário</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover {setting.email} da lista de notificações?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel data-testid="button-cancel-delete">{translations.common.cancel}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(setting.id)}
                                    data-testid="button-confirm-delete"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
