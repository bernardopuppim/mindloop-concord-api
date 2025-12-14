import { z } from "zod";
import {
  users,
  employees,
  servicePosts,
  allocations,
  occurrences,
  documents,
  documentChecklists,
  auditLogs,
  alerts,
  lgpdLogs,
  feriasLicencas,
  serviceActivities,
  activityExecutions,
  activityExecutionAttachments,
} from "./schema";

import { createInsertSchema } from "drizzle-zod";

// USERS
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

// EMPLOYEES
export const insertEmployeeSchema = createInsertSchema(employees)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    cpf: z
      .string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato XXX.XXX.XXX-XX"),
  });

// SERVICE POSTS
export const insertServicePostSchema = createInsertSchema(servicePosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ALLOCATIONS
export const insertAllocationSchema = createInsertSchema(allocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// OCCURRENCES
export const insertOccurrenceSchema = createInsertSchema(occurrences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  treated: true,
  treatedBy: true,
  treatedAt: true,
});

// DOCUMENTS
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

// AUDIT LOGS
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

// ALERTS
export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  resolvedBy: true,
  resolvedAt: true,
});

// LGPD LOGS
export const insertLgpdLogSchema = createInsertSchema(lgpdLogs).omit({
  id: true,
  timestamp: true,
});

// DOCUMENT CHECKLISTS
export const insertDocumentChecklistSchema = createInsertSchema(documentChecklists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// FÉRIAS E LICENÇAS
export const insertFeriasLicencasSchema = createInsertSchema(feriasLicencas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// SERVICE ACTIVITIES
export const insertServiceActivitySchema = createInsertSchema(serviceActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ACTIVITY EXECUTIONS
export const insertActivityExecutionSchema = createInsertSchema(activityExecutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ACTIVITY EXECUTION ATTACHMENTS
export const insertActivityExecutionAttachmentSchema =
  createInsertSchema(activityExecutionAttachments).omit({
    id: true,
    uploadedAt: true,
  });
