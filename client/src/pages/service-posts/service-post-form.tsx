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
