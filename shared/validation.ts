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
export const insertUserSchema = createInsertSchema(users);

// EMPLOYEES
export const insertEmployeeSchema = createInsertSchema(employees, {
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato XXX.XXX.XXX-XX"),
});

// SERVICE POSTS
export const insertServicePostSchema = createInsertSchema(servicePosts);

// ALLOCATIONS
export const insertAllocationSchema = createInsertSchema(allocations);

// OCCURRENCES
export const insertOccurrenceSchema = createInsertSchema(occurrences);

// DOCUMENTS
export const insertDocumentSchema = createInsertSchema(documents);

// AUDIT LOGS
export const insertAuditLogSchema = createInsertSchema(auditLogs);

// ALERTS
export const insertAlertSchema = createInsertSchema(alerts);

// LGPD LOGS
export const insertLgpdLogSchema = createInsertSchema(lgpdLogs);

// DOCUMENT CHECKLISTS
export const insertDocumentChecklistSchema = createInsertSchema(documentChecklists);

// FÉRIAS E LICENÇAS
export const insertFeriasLicencasSchema = createInsertSchema(feriasLicencas);

// SERVICE ACTIVITIES
export const insertServiceActivitySchema = createInsertSchema(serviceActivities);

// ACTIVITY EXECUTIONS
export const insertActivityExecutionSchema = createInsertSchema(activityExecutions);

// ACTIVITY EXECUTION ATTACHMENTS
export const insertActivityExecutionAttachmentSchema =
  createInsertSchema(activityExecutionAttachments);
