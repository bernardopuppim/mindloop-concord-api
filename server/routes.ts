import type { Express } from "express";

import { storage } from "./storage.js";

import { authenticateJWT } from "./auth/jwtAuth.js";
import { requireRole } from "./auth/rbac.js";

import {
  insertEmployeeSchema,
  insertServicePostSchema,
  insertAllocationSchema,
  insertOccurrenceSchema,
  insertDocumentChecklistSchema,
  insertFeriasLicencasSchema,
  insertServiceActivitySchema,
  insertActivityExecutionSchema,
} from "../shared/schema.js";

import { insertDocumentSchema } from "../shared/validation.js";

import multer from "multer";
import { supabaseAdmin } from "./supabaseClient.js";

/* ============================================================
   Upload settings (in-memory, serverless-friendly)
   ============================================================ */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "text/csv",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não permitido"));
    }
  },
});

/* ============================================================
   Audit + LGPD logs helpers
   ============================================================ */

async function logAction(userId: string | undefined, action: string, entityType: string, entityId?: any, details?: any, before?: any, after?: any) {
  try {
    await storage.createAuditLogWithDiff({
      userId: userId ?? null,
      action,
      entityType,
      entityId: entityId?.toString?.() ?? null,
      details,
      diffBefore: before ?? null,
      diffAfter: after ?? null,
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

async function logLgpdAccess(req: any, accessType: "view" | "export" | "search", dataCategory: "personal_data" | "sensitive_data" | "financial_data", entityType: string, entityId?: any, details?: any) {
  try {
    const userId = req.user?.sub || null;

    await storage.createLgpdLog({
      userId,
      accessType,
      dataCategory,
      entityType,
      entityId: entityId?.toString?.() ?? null,
      ipAddress: req.ip ?? null,
      userAgent: req.get("User-Agent") ?? null,
      details,
    });
  } catch (err) {
    console.error("LGPD log error:", err);
  }
}

/* ============================================================
   REGISTER ROUTES
   ============================================================ */

export async function registerRoutes(
  app: Express
): Promise<void> {

/* ============================
   AUTHENTICATED USER
   ============================ */

  app.get("/auth/user", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

/* ============================
   DASHBOARD BASIC
   ============================ */

  app.get("/dashboard/stats", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

/* ============================
   EMPLOYEES
   ============================ */

  app.get("/employees", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req: any, res) => {
    try {
      const { search } = req.query;

      const employees =
        search ? await storage.searchEmployees(search) : await storage.getEmployees();

      await logLgpdAccess(req, "view", "personal_data", "employees_list", undefined, {
        count: employees.length,
      });

      res.json(employees);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/employees/:id", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);

      if (!employee) return res.status(404).json({ message: "Employee not found" });

      await logLgpdAccess(req, "view", "personal_data", "employee", id, {
        employee: employee.name,
      });

      res.json(employee);
    } catch {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/employees", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const parsed = insertEmployeeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const employee = await storage.createEmployee(parsed.data);

      await logAction(req.user.id, "create", "employee", employee.id, {
        name: employee.name,
      });

      res.status(201).json(employee);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.status(400).json({ message: "CPF already exists" });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.patch("/employees/:id", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getEmployee(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      const updated = await storage.updateEmployee(id, req.body);

      await logAction(req.user.id, "update", "employee", id, req.body, before, updated);

      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/employees/:id", authenticateJWT, requireRole(["admin"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getEmployee(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      await storage.deleteEmployee(id);

      await logAction(req.user.id, "delete", "employee", id, null, before, null);

      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

/* ============================
   SERVICE POSTS
   ============================ */

  app.get("/service-posts", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req, res) => {
    try {
      const { search } = req.query;

      const posts = search
        ? await storage.searchServicePosts(search as string)
        : await storage.getServicePosts();

      res.json(posts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch service posts" });
    }
  });

  app.get("/service-posts/:id", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getServicePost(id);

      if (!post) return res.status(404).json({ message: "Service post not found" });

      res.json(post);
    } catch {
      res.status(500).json({ message: "Failed to fetch service post" });
    }
  });

  app.post("/service-posts", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const parsed = insertServicePostSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const post = await storage.createServicePost(parsed.data);

      await logAction(req.user.id, "create", "service_post", post.id, {
        postCode: post.postCode,
      });

      res.status(201).json(post);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.status(400).json({ message: "Post code already exists" });
      }
      res.status(500).json({ message: "Failed to create service post" });
    }
  });

  app.patch("/service-posts/:id", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getServicePost(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      const updated = await storage.updateServicePost(id, req.body);

      await logAction(req.user.id, "update", "service_post", id, req.body, before, updated);

      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update service post" });
    }
  });

  app.delete("/service-posts/:id", authenticateJWT, requireRole(["admin"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getServicePost(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      await storage.deleteServicePost(id);

      await logAction(req.user.id, "delete", "service_post", id, null, before, null);

      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete service post" });
    }
  });

/* ============================
   ALLOCATIONS
   ============================ */

  app.get("/allocations", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req: any, res) => {
    try {
      const { date, employeeId, postId, startDate, endDate } = req.query;

      let allocations;

      if (startDate && endDate) {
        allocations = await storage.getAllocationsByDateRange(
          startDate as string,
          endDate as string
        );
      } else {
        allocations = await storage.getAllocations({
          date: date as string | undefined,
          employeeId: employeeId ? parseInt(employeeId as string) : undefined,
          postId: postId ? parseInt(postId as string) : undefined,
        });
      }

      await logLgpdAccess(req, "view", "personal_data", "allocations_list", undefined, {
        count: allocations.length,
      });

      res.json(allocations);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch allocations" });
    }
  });

    app.get("/allocations/:id", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const allocation = await storage.getAllocation(id);

      if (!allocation) return res.status(404).json({ message: "Allocation not found" });

      await logLgpdAccess(req, "view", "personal_data", "allocation", id, {
        employeeId: allocation.employeeId,
        date: allocation.date,
      });

      res.json(allocation);
    } catch {
      res.status(500).json({ message: "Failed to fetch allocation" });
    }
  });

  app.post("/allocations", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const parsed = insertAllocationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const allocation = await storage.createAllocation(parsed.data);

      await logAction(req.user.id, "create", "allocation", allocation.id);

      res.status(201).json(allocation);
    } catch {
      res.status(500).json({ message: "Failed to create allocation" });
    }
  });

  app.patch("/allocations/:id", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getAllocation(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      const updated = await storage.updateAllocation(id, req.body);

      await logAction(req.user.id, "update", "allocation", id, req.body, before, updated);

      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update allocation" });
    }
  });

  app.delete("/allocations/:id", authenticateJWT, requireRole(["admin"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getAllocation(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      await storage.deleteAllocation(id);

      await logAction(req.user.id, "delete", "allocation", id, null, before, null);

      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete allocation" });
    }
  });

/* ============================
   CSV IMPORT (ALLOCATIONS)
   ============================ */

  app.post(
    "/allocations/import-csv",
    authenticateJWT,
    requireRole(["admin", "operador"]),
    upload.single("file"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const { postId } = req.body;

        const parsedPostId = parseInt(postId);
        if (isNaN(parsedPostId)) {
          return res.status(400).json({ message: "Invalid postId" });
        }

        // Read from memory buffer instead of disk
        const content = req.file.buffer.toString("utf-8");

        const lines = content.trim().split("\n");
        if (lines.length < 2) {
          return res.status(400).json({ message: "CSV must contain data rows" });
        }

        const headers = lines[0].toLowerCase().split(",");
        const empIdx = headers.indexOf("employee_id");
        const dateIdx = headers.indexOf("date");
        const statusIdx = headers.indexOf("status");

        if (empIdx === -1 || dateIdx === -1 || statusIdx === -1) {
          return res.status(400).json({
            message: "CSV must have employee_id,date,status",
          });
        }

        const allocations = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          allocations.push({
            employeeId: parseInt(cols[empIdx]),
            postId: parsedPostId,
            date: cols[dateIdx],
            status: cols[statusIdx],
          });
        }

        const created = await storage.bulkCreateAllocations(allocations as any);

        await logAction(req.user.id, "bulk_import", "allocation", undefined, {
          count: created.length,
        });

        res.json({ imported: created.length });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to import CSV" });
      }
    }
  );

/* ============================
   OCCURRENCES
   ============================ */

  app.get("/occurrences", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req: any, res) => {
    try {
      const { startDate, endDate, category, employeeId } = req.query;

      const occurrences = await storage.getOccurrences({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        category: category as string | undefined,
        employeeId: employeeId ? parseInt(employeeId as string) : undefined,
      });

      await logLgpdAccess(req, "view", "personal_data", "occurrences_list", undefined, {
        count: occurrences.length,
      });

      res.json(occurrences);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch occurrences" });
    }
  });

  app.get("/occurrences/:id", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const occurrence = await storage.getOccurrence(id);

      if (!occurrence) {
        return res.status(404).json({ message: "Occurrence not found" });
      }

      await logLgpdAccess(req, "view", "personal_data", "occurrence", id, {
        employeeId: occurrence.employeeId,
      });

      res.json(occurrence);
    } catch {
      res.status(500).json({ message: "Failed to fetch occurrence" });
    }
  });

  app.post("/occurrences", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const parsed = insertOccurrenceSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const occurrence = await storage.createOccurrence(parsed.data);

      await logAction(req.user.id, "create", "occurrence", occurrence.id);

      res.status(201).json(occurrence);
    } catch {
      res.status(500).json({ message: "Failed to create occurrence" });
    }
  });

  app.patch("/occurrences/:id", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getOccurrence(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      const updated = await storage.updateOccurrence(id, req.body);

      await logAction(req.user.id, "update", "occurrence", id, req.body, before, updated);

      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update occurrence" });
    }
  });

  app.delete("/occurrences/:id", authenticateJWT, requireRole(["admin"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getOccurrence(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      await storage.deleteOccurrence(id);

      await logAction(req.user.id, "delete", "occurrence", id, null, before, null);

      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete occurrence" });
    }
  });

  /* ============================
   DOCUMENTS
   ============================ */

  app.get("/documents", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req: any, res) => {
    try {
      const { employeeId, postId, category, type } = req.query;

      const documents = await storage.getDocuments({
        employeeId: employeeId ? parseInt(employeeId as string) : undefined,
        postId: postId ? parseInt(postId as string) : undefined,
        category: category as string | undefined,
        type: type as string | undefined,
      });

      await logLgpdAccess(req, "view", "personal_data", "documents_list", undefined, {
        count: documents.length,
      });

      res.json(documents);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/documents/:id", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      await logLgpdAccess(req, "view", "sensitive_data", "document", id);

      res.json(document);
    } catch {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post(
    "/documents",
    authenticateJWT,
    requireRole(["admin", "operador"]),
    upload.single("file"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const parsed = insertDocumentSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json(parsed.error);
        }

        // Generate storage path following documented structure
        const timestamp = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
        const contractId = parsed.data.postId || "general";
        const employeeId = parsed.data.employeeId || "unassigned";
        const safeName = req.file.originalname
          .toLowerCase()
          .replace(/[^a-z0-9.]/g, "-");

        const storagePath = `contracts/${contractId}/employees/${employeeId}/${timestamp}_${safeName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from("contract-documents")
          .upload(storagePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          console.error("Supabase upload error:", uploadError);
          return res.status(500).json({
            message: "Failed to upload to storage",
            error: uploadError.message
          });
        }

        // Save metadata to database
        const doc = await storage.createDocument({
          ...parsed.data,
          path: storagePath,
          filename: safeName,
          size: req.file.size,
          mimeType: req.file.mimetype,
          originalName: req.file.originalname,
          uploadedBy: req.user.id,
        });

        await logAction(req.user.id, "create", "document", doc.id);

        res.status(201).json(doc);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to upload document" });
      }
    }
  );

  app.get("/documents/:id/download", authenticateJWT, requireRole(["admin", "fiscal"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Generate signed URL (expires in 10 minutes)
      const { data: signedData, error: signedError } = await supabaseAdmin.storage
        .from("contract-documents")
        .createSignedUrl(document.path, 600); // 600 seconds = 10 minutes

      if (signedError || !signedData) {
        console.error("Signed URL error:", signedError);
        return res.status(500).json({ message: "Failed to generate download URL" });
      }

      await logLgpdAccess(req, "export", "sensitive_data", "document", id);

      res.json({
        url: signedData.signedUrl,
        originalName: document.originalName,
        expiresIn: 600
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  app.patch("/documents/:id", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getDocument(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      const updated = await storage.updateDocument(id, req.body);

      await logAction(req.user.id, "update", "document", id, req.body, before, updated);

      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/documents/:id", authenticateJWT, requireRole(["admin"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getDocument(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      // Delete from Supabase Storage
      const { error: deleteError } = await supabaseAdmin.storage
        .from("contract-documents")
        .remove([before.path]);

      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        // Continue with database deletion even if storage delete fails
      }

      await storage.deleteDocument(id);

      await logAction(req.user.id, "delete", "document", id, null, before, null);

      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

/* ============================
   DOCUMENT CHECKLISTS
   ============================ */

  app.get("/document-checklists", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (_req, res) => {
    try {
      const items = await storage.getDocumentChecklists();
      res.json(items);
    } catch {
      res.status(500).json({ message: "Failed to fetch document checklists" });
    }
  });

  app.post("/document-checklists", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const parsed = insertDocumentChecklistSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const checklist = await storage.createDocumentChecklist(parsed.data);

      await logAction(req.user.id, "create", "document_checklist", checklist.id);

      res.status(201).json(checklist);
    } catch {
      res.status(500).json({ message: "Failed to create document checklist" });
    }
  });

  app.delete(
    "/document-checklists/:id",
    authenticateJWT,
    requireRole(["admin"]),
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);

        const before = await storage.getDocumentChecklist(id);
        if (!before) return res.status(404).json({ message: "Not found" });

        await storage.deleteDocumentChecklist(id);

        await logAction(req.user.id, "delete", "document_checklist", id, null, before, null);

        res.status(204).send();
      } catch {
        res.status(500).json({ message: "Failed to delete document checklist" });
      }
    }
  );

/* ============================
   FÉRIAS / LICENÇAS
   ============================ */

  app.get("/ferias-licencas", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (_req, res) => {
    try {
      const items = await storage.getFeriasLicencas();
      res.json(items);
    } catch {
      res.status(500).json({ message: "Failed to fetch ferias/licencas" });
    }
  });

  app.post("/ferias-licencas", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const parsed = insertFeriasLicencasSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const record = await storage.createFeriasLicenca({
        ...parsed.data,
        createdBy: req.user.id,
      });

      await logAction(req.user.id, "create", "ferias_licencas", record.id);

      res.status(201).json(record);
    } catch {
      res.status(500).json({ message: "Failed to create ferias/licenca" });
    }
  });

  app.patch("/ferias-licencas/:id", authenticateJWT, requireRole(["admin", "operador"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getFeriasLicenca(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      const updated = await storage.updateFeriasLicenca(id, req.body);

      await logAction(req.user.id, "update", "ferias_licencas", id, req.body, before, updated);

      res.json(updated);
    } catch {
      res.status(500).json({ message: "Failed to update ferias/licenca" });
    }
  });

  app.delete("/ferias-licencas/:id", authenticateJWT, requireRole(["admin"]), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);

      const before = await storage.getFeriasLicenca(id);
      if (!before) return res.status(404).json({ message: "Not found" });

      await storage.deleteFeriasLicenca(id);

      await logAction(req.user.id, "delete", "ferias_licencas", id, null, before, null);

      res.status(204).send();
    } catch {
      res.status(500).json({ message: "Failed to delete ferias/licenca" });
    }
  });

/* ============================
   AUDIT LOGS
   ============================ */

  app.get("/audit-logs", authenticateJWT, requireRole(["admin"]), async (_req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

/* ============================
   LGPD LOGS
   ============================ */

  app.get("/lgpd-logs", authenticateJWT, requireRole(["admin"]), async (_req, res) => {
    try {
      const logs = await storage.getLgpdLogs();
      res.json(logs);
    } catch {
      res.status(500).json({ message: "Failed to fetch LGPD logs" });
    }
  });

/* ============================
   DASHBOARD SUMMARY
   ============================ */

  app.get("/dashboard/summary", authenticateJWT, requireRole(["admin", "fiscal", "operador", "visualizador"]), async (_req, res) => {
    try {
      const summary = await storage.getDashboardSummary();
      res.json(summary);
    } catch {
      res.status(500).json({ message: "Failed to load dashboard summary" });
    }
  });

/* ============================
   ERROR HANDLER (FINAL)
   ============================ */

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("Unhandled route error:", err);

    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  console.log("Routes registered with Supabase Auth + JWT.");
}
