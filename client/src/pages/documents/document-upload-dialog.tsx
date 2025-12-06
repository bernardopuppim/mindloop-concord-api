import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, X, FileText, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { getMonthYearOptions } from "@/lib/authUtils";
import { translations } from "@/lib/translations";
import type { Employee, ServicePost } from "@shared/schema";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  servicePosts: ServicePost[];
}

export function DocumentUploadDialog({ open, onOpenChange, employees, servicePosts }: DocumentUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("other");
  const [linkType, setLinkType] = useState<string>("none");
  const [linkedId, setLinkedId] = useState<string>("");
  const [monthYear, setMonthYear] = useState<string>("");
  const [expirationDate, setExpirationDate] = useState<string>("");

  const monthYearOptions = getMonthYearOptions();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error(translations.validation.fileRequired);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("documentType", documentType);

      if (linkType === "employee" && linkedId) {
        formData.append("employeeId", linkedId);
      } else if (linkType === "post" && linkedId) {
        formData.append("postId", linkedId);
      } else if (linkType === "month" && monthYear) {
        formData.append("monthYear", monthYear);
      }

      if (expirationDate) {
        formData.append("expirationDate", expirationDate);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || translations.documents.uploadFailed);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/expiring"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/expired"] });
      toast({ title: translations.common.success, description: translations.documents.documentUploaded });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: translations.common.error,
        description: error.message || translations.errors.saveError,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: translations.common.error, description: translations.validation.fileTooLarge.replace("{max}", "10"), variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDocumentType("other");
    setLinkType("none");
    setLinkedId("");
    setMonthYear("");
    setExpirationDate("");
    onOpenChange(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: translations.common.error, description: translations.validation.fileTooLarge.replace("{max}", "10"), variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{translations.documents.uploadDocument}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors hover:border-primary/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="drop-zone"
          >
            {selectedFile ? (
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  data-testid="button-remove-file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{translations.common.dragDrop}</p>
                <p className="text-xs text-muted-foreground mt-1">{translations.documents.acceptedFormats}</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
            className="hidden"
            onChange={handleFileChange}
            data-testid="input-file"
          />

          <div className="space-y-2">
            <Label>{translations.documents.type}</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger data-testid="select-doc-type">
                <SelectValue placeholder={translations.common.selectOption} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aso">{translations.documents.aso}</SelectItem>
                <SelectItem value="certification">{translations.documents.certification}</SelectItem>
                <SelectItem value="evidence">{translations.documents.evidence}</SelectItem>
                <SelectItem value="contract">{translations.documents.contract}</SelectItem>
                <SelectItem value="other">{translations.documents.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{translations.documents.linkTo}</Label>
            <Select value={linkType} onValueChange={(v) => { setLinkType(v); setLinkedId(""); setMonthYear(""); }}>
              <SelectTrigger data-testid="select-link-type">
                <SelectValue placeholder={translations.common.selectOption} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{translations.documents.none}</SelectItem>
                <SelectItem value="employee">{translations.documents.employee}</SelectItem>
                <SelectItem value="post">{translations.documents.post}</SelectItem>
                <SelectItem value="month">{translations.documents.monthlyEvidence}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {linkType === "employee" && (
            <div className="space-y-2">
              <Label>{translations.documents.selectEmployee}</Label>
              <Select value={linkedId} onValueChange={setLinkedId}>
                <SelectTrigger data-testid="select-link-employee">
                  <SelectValue placeholder={translations.common.selectOption} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {linkType === "post" && (
            <div className="space-y-2">
              <Label>{translations.documents.selectServicePost}</Label>
              <Select value={linkedId} onValueChange={setLinkedId}>
                <SelectTrigger data-testid="select-link-post">
                  <SelectValue placeholder={translations.common.selectOption} />
                </SelectTrigger>
                <SelectContent>
                  {servicePosts.map((post) => (
                    <SelectItem key={post.id} value={post.id.toString()}>
                      {post.postCode} - {post.postName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {linkType === "month" && (
            <div className="space-y-2">
              <Label>{translations.documents.selectMonthYear}</Label>
              <Select value={monthYear} onValueChange={setMonthYear}>
                <SelectTrigger data-testid="select-link-month">
                  <SelectValue placeholder={translations.common.selectOption} />
                </SelectTrigger>
                <SelectContent>
                  {monthYearOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{translations.documents.expirationDate} ({translations.common.optional})</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="pl-9"
                data-testid="input-expiration-date"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {translations.documents.setExpirationHint}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
            {translations.common.cancel}
          </Button>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploadMutation.isPending}
            data-testid="button-upload"
          >
            {uploadMutation.isPending ? translations.common.sending : translations.common.uploadFile}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
