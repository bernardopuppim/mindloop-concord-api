import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
import {
  insertEmployeeSchema,
  insertServicePostSchema,
  insertAllocationSchema,
  insertOccurrenceSchema,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${randomUUID()}${ext}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

async function logAction(
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId?: string | number,
  details?: any
) {
  try {
    await storage.createAuditLog({
      userId: userId || null,
      action,
      entityType,
      entityId: entityId?.toString() || null,
      details,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/dashboard/stats", isAuthenticated, async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/analytics/allocation-trends", isAuthenticated, async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const trends = await storage.getAllocationTrends(days);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching allocation trends:", error);
      res.status(500).json({ message: "Failed to fetch allocation trends" });
    }
  });

  app.get("/api/analytics/occurrences-by-category", isAuthenticated, async (_req, res) => {
    try {
      const data = await storage.getOccurrencesByCategory();
      res.json(data);
    } catch (error) {
      console.error("Error fetching occurrences by category:", error);
      res.status(500).json({ message: "Failed to fetch occurrences by category" });
    }
  });

  app.get("/api/analytics/compliance-metrics", isAuthenticated, async (_req, res) => {
    try {
      const metrics = await storage.getComplianceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching compliance metrics:", error);
      res.status(500).json({ message: "Failed to fetch compliance metrics" });
    }
  });

  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const { search } = req.query;
      const employeesList = search
        ? await storage.searchEmployees(search as string)
        : await storage.getEmployees();
      res.json(employeesList);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parsed = insertEmployeeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const employee = await storage.createEmployee(parsed.data);
      await logAction(req.user?.claims?.sub, "create", "employee", employee.id, { name: employee.name });
      res.status(201).json(employee);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "CPF already exists" });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.updateEmployee(id, req.body);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      await logAction(req.user?.claims?.sub, "update", "employee", id, req.body);
      res.json(employee);
    } catch (error: any) {
      console.error("Error updating employee:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "CPF already exists" });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmployee(id);
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }
      await logAction(req.user?.claims?.sub, "delete", "employee", id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  app.get("/api/service-posts", isAuthenticated, async (req, res) => {
    try {
      const { search } = req.query;
      const posts = search
        ? await storage.searchServicePosts(search as string)
        : await storage.getServicePosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching service posts:", error);
      res.status(500).json({ message: "Failed to fetch service posts" });
    }
  });

  app.get("/api/service-posts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getServicePost(id);
      if (!post) {
        return res.status(404).json({ message: "Service post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching service post:", error);
      res.status(500).json({ message: "Failed to fetch service post" });
    }
  });

  app.post("/api/service-posts", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parsed = insertServicePostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const post = await storage.createServicePost(parsed.data);
      await logAction(req.user?.claims?.sub, "create", "service_post", post.id, { postCode: post.postCode });
      res.status(201).json(post);
    } catch (error: any) {
      console.error("Error creating service post:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Post code already exists" });
      }
      res.status(500).json({ message: "Failed to create service post" });
    }
  });

  app.patch("/api/service-posts/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.updateServicePost(id, req.body);
      if (!post) {
        return res.status(404).json({ message: "Service post not found" });
      }
      await logAction(req.user?.claims?.sub, "update", "service_post", id, req.body);
      res.json(post);
    } catch (error: any) {
      console.error("Error updating service post:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Post code already exists" });
      }
      res.status(500).json({ message: "Failed to update service post" });
    }
  });

  app.delete("/api/service-posts/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteServicePost(id);
      if (!deleted) {
        return res.status(404).json({ message: "Service post not found" });
      }
      await logAction(req.user?.claims?.sub, "delete", "service_post", id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service post:", error);
      res.status(500).json({ message: "Failed to delete service post" });
    }
  });

  app.get("/api/allocations", isAuthenticated, async (req, res) => {
    try {
      const { date, employeeId, postId, startDate, endDate } = req.query;
      let allocationsList;
      if (startDate && endDate) {
        allocationsList = await storage.getAllocationsByDateRange(
          startDate as string,
          endDate as string
        );
      } else {
        allocationsList = await storage.getAllocations({
          date: date as string | undefined,
          employeeId: employeeId ? parseInt(employeeId as string) : undefined,
          postId: postId ? parseInt(postId as string) : undefined,
        });
      }
      res.json(allocationsList);
    } catch (error) {
      console.error("Error fetching allocations:", error);
      res.status(500).json({ message: "Failed to fetch allocations" });
    }
  });

  app.get("/api/allocations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const allocation = await storage.getAllocation(id);
      if (!allocation) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      res.json(allocation);
    } catch (error) {
      console.error("Error fetching allocation:", error);
      res.status(500).json({ message: "Failed to fetch allocation" });
    }
  });

  app.post("/api/allocations", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parsed = insertAllocationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const allocation = await storage.createAllocation(parsed.data);
      await logAction(req.user?.claims?.sub, "create", "allocation", allocation.id);
      res.status(201).json(allocation);
    } catch (error) {
      console.error("Error creating allocation:", error);
      res.status(500).json({ message: "Failed to create allocation" });
    }
  });

  app.patch("/api/allocations/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const allocation = await storage.updateAllocation(id, req.body);
      if (!allocation) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      await logAction(req.user?.claims?.sub, "update", "allocation", id, req.body);
      res.json(allocation);
    } catch (error) {
      console.error("Error updating allocation:", error);
      res.status(500).json({ message: "Failed to update allocation" });
    }
  });

  app.delete("/api/allocations/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAllocation(id);
      if (!deleted) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      await logAction(req.user?.claims?.sub, "delete", "allocation", id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting allocation:", error);
      res.status(500).json({ message: "Failed to delete allocation" });
    }
  });

  app.post("/api/allocations/copy-month", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { sourceMonth, targetMonth, postId } = req.body;
      
      if (!sourceMonth || !targetMonth || !postId) {
        return res.status(400).json({ message: "sourceMonth, targetMonth, and postId are required" });
      }

      const parsedPostId = parseInt(postId);
      if (isNaN(parsedPostId) || parsedPostId <= 0) {
        return res.status(400).json({ message: "Invalid postId" });
      }

      if (!/^\d{4}-\d{2}$/.test(sourceMonth) || !/^\d{4}-\d{2}$/.test(targetMonth)) {
        return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
      }

      if (sourceMonth === targetMonth) {
        return res.status(400).json({ message: "Source and target months must be different" });
      }

      const sourceStart = `${sourceMonth}-01`;
      const sourceYear = parseInt(sourceMonth.split("-")[0]);
      const sourceMonthNum = parseInt(sourceMonth.split("-")[1]);
      const sourceDaysInMonth = new Date(sourceYear, sourceMonthNum, 0).getDate();
      const sourceEnd = `${sourceMonth}-${String(sourceDaysInMonth).padStart(2, "0")}`;

      const targetYear = parseInt(targetMonth.split("-")[0]);
      const targetMonthNum = parseInt(targetMonth.split("-")[1]);
      const targetDaysInMonth = new Date(targetYear, targetMonthNum, 0).getDate();
      const targetStart = `${targetMonth}-01`;
      const targetEnd = `${targetMonth}-${String(targetDaysInMonth).padStart(2, "0")}`;

      const sourceAllocations = await storage.getAllocationsByDateRangeAndPost(
        sourceStart,
        sourceEnd,
        parsedPostId
      );

      if (sourceAllocations.length === 0) {
        return res.status(400).json({ message: "No allocations found in source month" });
      }

      await storage.deleteAllocationsByDateRangeAndPost(targetStart, targetEnd, parsedPostId);

      const newAllocations = sourceAllocations.map((allocation) => {
        const sourceDate = new Date(allocation.date);
        const dayOfMonth = sourceDate.getDate();
        const adjustedDay = Math.min(dayOfMonth, targetDaysInMonth);
        const targetDate = `${targetMonth}-${String(adjustedDay).padStart(2, "0")}`;

        return {
          employeeId: allocation.employeeId,
          postId: parsedPostId,
          date: targetDate,
          status: allocation.status,
          notes: allocation.notes,
        };
      });

      const uniqueAllocations = newAllocations.reduce((acc, curr) => {
        const key = `${curr.employeeId}-${curr.date}`;
        if (!acc.has(key)) {
          acc.set(key, curr);
        }
        return acc;
      }, new Map());

      const created = await storage.bulkCreateAllocations(Array.from(uniqueAllocations.values()));
      await logAction(req.user?.claims?.sub, "bulk_copy", "allocation", undefined, {
        sourceMonth,
        targetMonth,
        postId,
        count: created.length,
      });

      res.status(201).json({ message: "Allocations copied successfully", count: created.length });
    } catch (error) {
      console.error("Error copying allocations:", error);
      res.status(500).json({ message: "Failed to copy allocations" });
    }
  });

  app.post(
    "/api/allocations/import-csv",
    isAuthenticated,
    isAdmin,
    upload.single("file"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const { postId, month } = req.body;
        if (!postId || !month) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ message: "postId and month are required" });
        }

        const parsedPostId = parseInt(postId);
        if (isNaN(parsedPostId) || parsedPostId <= 0) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ message: "Invalid postId" });
        }

        const fileContent = fs.readFileSync(req.file.path, "utf-8");
        fs.unlinkSync(req.file.path);

        const normalizedContent = fileContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const lines = normalizedContent.trim().split("\n");
        if (lines.length < 2) {
          return res.status(400).json({ message: "CSV file must have headers and at least one data row" });
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
        const employeeIdIndex = headers.findIndex((h) => h === "employee_id" || h === "employeeid");
        const dateIndex = headers.findIndex((h) => h === "date");
        const statusIndex = headers.findIndex((h) => h === "status");

        if (employeeIdIndex === -1 || dateIndex === -1 || statusIndex === -1) {
          return res.status(400).json({
            message: "CSV must have columns: employee_id (or employeeid), date, status",
          });
        }

        const validStatuses = ["present", "absent", "justified", "vacation", "medical_leave"];
        const allocationsToCreate: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
          const employeeId = parseInt(values[employeeIdIndex]);
          const dateValue = values[dateIndex];
          const statusValue = values[statusIndex]?.toLowerCase();

          if (isNaN(employeeId) || employeeId <= 0) {
            errors.push(`Row ${i + 1}: Invalid employee_id`);
            continue;
          }

          if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            errors.push(`Row ${i + 1}: Invalid date format (use YYYY-MM-DD)`);
            continue;
          }

          if (!statusValue || !validStatuses.includes(statusValue)) {
            errors.push(`Row ${i + 1}: Invalid status "${statusValue || 'empty'}". Valid: ${validStatuses.join(", ")}`);
            continue;
          }

          allocationsToCreate.push({
            employeeId,
            postId: parsedPostId,
            date: dateValue,
            status: statusValue,
          });
        }

        if (allocationsToCreate.length === 0) {
          return res.status(400).json({
            message: "No valid allocations found in CSV",
            errors,
          });
        }

        const uniqueAllocations = allocationsToCreate.reduce((acc, curr) => {
          const key = `${curr.employeeId}-${curr.date}`;
          acc.set(key, curr);
          return acc;
        }, new Map());

        const created = await storage.bulkCreateAllocations(Array.from(uniqueAllocations.values()));
        await logAction(req.user?.claims?.sub, "bulk_import", "allocation", undefined, {
          postId,
          month,
          count: created.length,
        });

        res.status(201).json({
          message: "CSV imported successfully",
          imported: created.length,
          errors: errors.length > 0 ? errors : undefined,
        });
      } catch (error) {
        console.error("Error importing CSV:", error);
        res.status(500).json({ message: "Failed to import CSV" });
      }
    }
  );

  app.get("/api/occurrences", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, category, employeeId } = req.query;
      const occurrencesList = await storage.getOccurrences({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        category: category as string | undefined,
        employeeId: employeeId ? parseInt(employeeId as string) : undefined,
      });
      res.json(occurrencesList);
    } catch (error) {
      console.error("Error fetching occurrences:", error);
      res.status(500).json({ message: "Failed to fetch occurrences" });
    }
  });

  app.get("/api/occurrences/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const occurrence = await storage.getOccurrence(id);
      if (!occurrence) {
        return res.status(404).json({ message: "Occurrence not found" });
      }
      res.json(occurrence);
    } catch (error) {
      console.error("Error fetching occurrence:", error);
      res.status(500).json({ message: "Failed to fetch occurrence" });
    }
  });

  app.post("/api/occurrences", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parsed = insertOccurrenceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }
      const occurrence = await storage.createOccurrence(parsed.data);
      await logAction(req.user?.claims?.sub, "create", "occurrence", occurrence.id);
      res.status(201).json(occurrence);
    } catch (error) {
      console.error("Error creating occurrence:", error);
      res.status(500).json({ message: "Failed to create occurrence" });
    }
  });

  app.patch("/api/occurrences/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const occurrence = await storage.updateOccurrence(id, req.body);
      if (!occurrence) {
        return res.status(404).json({ message: "Occurrence not found" });
      }
      await logAction(req.user?.claims?.sub, "update", "occurrence", id, req.body);
      res.json(occurrence);
    } catch (error) {
      console.error("Error updating occurrence:", error);
      res.status(500).json({ message: "Failed to update occurrence" });
    }
  });

  app.delete("/api/occurrences/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOccurrence(id);
      if (!deleted) {
        return res.status(404).json({ message: "Occurrence not found" });
      }
      await logAction(req.user?.claims?.sub, "delete", "occurrence", id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting occurrence:", error);
      res.status(500).json({ message: "Failed to delete occurrence" });
    }
  });

  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const { documentType, employeeId, postId, monthYear } = req.query;
      const documentsList = await storage.getDocuments({
        documentType: documentType as string | undefined,
        employeeId: employeeId ? parseInt(employeeId as string) : undefined,
        postId: postId ? parseInt(postId as string) : undefined,
        monthYear: monthYear as string | undefined,
      });
      res.json(documentsList);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post(
    "/api/documents/upload",
    isAuthenticated,
    isAdmin,
    upload.single("file"),
    async (req: any, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const { documentType, employeeId, postId, monthYear } = req.body;

        const document = await storage.createDocument({
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          documentType: documentType || "other",
          employeeId: employeeId ? parseInt(employeeId) : null,
          postId: postId ? parseInt(postId) : null,
          monthYear: monthYear || null,
          uploadedBy: req.user?.claims?.sub || null,
        });

        await logAction(req.user?.claims?.sub, "upload", "document", document.id, {
          filename: document.originalName,
        });
        res.status(201).json(document);
      } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ message: "Failed to upload document" });
      }
    }
  );

  app.get("/api/documents/:id/download", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (!fs.existsSync(document.path)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.download(document.path, document.originalName);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (fs.existsSync(document.path)) {
        fs.unlinkSync(document.path);
      }

      await storage.deleteDocument(id);
      await logAction(req.user?.claims?.sub, "delete", "document", id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  app.get("/api/users", isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const usersList = await storage.getAllUsers();
      res.json(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!["admin", "viewer"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const user = await storage.updateUserRole(id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await logAction(req.user?.claims?.sub, "update_role", "user", id, { role });
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get("/api/audit-logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  return httpServer;
}
