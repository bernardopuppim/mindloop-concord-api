import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { translations } from "@/lib/translations";
import type { ServicePost } from "@shared/schema";

const formSchema = z.object({
  postCode: z.string().min(1, translations.validation.required),
  postName: z.string().min(2, "Nome do posto deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  unit: z.string().min(2, translations.validation.required),
  modality: z.enum(["onsite", "hybrid", "remote"]),
  tipoPosto: z.string().optional(),
  horarioTrabalho: z.string().optional(),
  escalaRegime: z.string().optional(),
  quantidadePrevista: z.coerce.number().int().min(0).optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface ServicePostFormProps {
  postId?: number;
}

export default function ServicePostForm({ postId }: ServicePostFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEditing = !!postId;

  const { data: servicePost, isLoading } = useQuery<ServicePost>({
    queryKey: ["/api/service-posts", postId],
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postCode: "",
      postName: "",
      description: "",
      unit: "",
      modality: "onsite",
      tipoPosto: "",
      horarioTrabalho: "",
      escalaRegime: "",
      quantidadePrevista: null,
    },
  });

  useEffect(() => {
    if (servicePost) {
      form.reset({
        postCode: servicePost.postCode,
        postName: servicePost.postName,
        description: servicePost.description || "",
        unit: servicePost.unit,
        modality: servicePost.modality,
        tipoPosto: servicePost.tipoPosto || "",
        horarioTrabalho: servicePost.horarioTrabalho || "",
        escalaRegime: servicePost.escalaRegime || "",
        quantidadePrevista: servicePost.quantidadePrevista ?? null,
      });
    }
  }, [servicePost, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        await apiRequest("PATCH", `/api/service-posts/${postId}`, data);
      } else {
        await apiRequest("POST", "/api/service-posts", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-posts"] });
      toast({
        title: translations.common.success,
        description: isEditing ? translations.servicePosts.postUpdated : translations.servicePosts.postCreated,
      });
      setLocation("/service-posts");
    },
    onError: (error: Error) => {
      toast({
        title: translations.common.error,
        description: error.message || translations.errors.saveError,
        variant: "destructive",
      });
    },
  });

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={translations.common.loading} />
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? translations.servicePosts.editPost : translations.servicePosts.addPost}
        description={isEditing ? "Atualizar informações do posto de serviço" : "Criar um novo posto de serviço"}
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Informações do Posto de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="postCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translations.servicePosts.postCode} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: POST-001" {...field} className="font-mono" data-testid="input-post-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translations.servicePosts.modality} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-post-modality">
                            <SelectValue placeholder={translations.common.selectOption} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="onsite">{translations.servicePosts.onsite}</SelectItem>
                          <SelectItem value="hybrid">{translations.servicePosts.hybrid}</SelectItem>
                          <SelectItem value="remote">{translations.servicePosts.remote}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{translations.servicePosts.postName} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome do posto" {...field} data-testid="input-post-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{translations.common.unit} *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite a unidade" {...field} data-testid="input-post-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{translations.common.description}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite a descrição (opcional)"
                          rows={4}
                          {...field}
                          data-testid="input-post-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipoPosto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translations.servicePosts.tipoPosto}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Administrativo, Operacional" 
                          {...field} 
                          value={field.value || ""} 
                          data-testid="input-tipo-posto" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horarioTrabalho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translations.servicePosts.horarioTrabalho}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: 08:00 - 17:00" 
                          {...field} 
                          value={field.value || ""} 
                          data-testid="input-horario-trabalho" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="escalaRegime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translations.servicePosts.escalaRegime}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: 5x2, 12x36" 
                          {...field} 
                          value={field.value || ""} 
                          data-testid="input-escala-regime" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantidadePrevista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{translations.servicePosts.quantidadePrevista}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Ex: 5" 
                          {...field} 
                          value={field.value ?? ""} 
                          onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                          data-testid="input-quantidade-prevista" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/service-posts")}
                  data-testid="button-cancel"
                >
                  {translations.common.cancel}
                </Button>
                <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
                  {mutation.isPending ? "Salvando..." : isEditing ? translations.common.update : translations.common.save}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
