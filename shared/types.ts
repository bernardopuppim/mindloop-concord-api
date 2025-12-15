import {
  users,
  employees,
  servicePosts,
  allocations,
  occurrences,
  documents,
  auditLogs,
  alerts,
  lgpdLogs,
  documentChecklists,
  feriasLicencas,
  serviceActivities,
  activityExecutions,
  activityExecutionAttachments,
} from "./schema.js";

import {
  insertEmployeeSchema,
  insertServicePostSchema,
  insertAllocationSchema,
  insertOccurrenceSchema,
  insertDocumentSchema,
  insertAuditLogSchema,
  insertAlertSchema,
  insertLgpdLogSchema,
  insertDocumentChecklistSchema,
  insertFeriasLicencasSchema,
  insertServiceActivitySchema,
  insertActivityExecutionSchema,
  insertActivityExecutionAttachmentSchema,
} from "./validation.js";

import { z } from "zod";

// BASIC TYPES
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type ServicePost = typeof servicePosts.$inferSelect;
export type InsertServicePost = z.infer<typeof insertServicePostSchema>;

export type Allocation = typeof allocations.$inferSelect;
export type InsertAllocation = z.infer<typeof insertAllocationSchema>;

export type Occurrence = typeof occurrences.$inferSelect;
export type InsertOccurrence = z.infer<typeof insertOccurrenceSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type NotificationSettings = any;
export type InsertNotificationSettings = any;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type LgpdLog = typeof lgpdLogs.$inferSelect;
export type InsertLgpdLog = z.infer<typeof insertLgpdLogSchema>;

export type DocumentChecklist = typeof documentChecklists.$inferSelect;
export type InsertDocumentChecklist = z.infer<typeof insertDocumentChecklistSchema>;

export type FeriasLicencas = typeof feriasLicencas.$inferSelect;
export type InsertFeriasLicencas = z.infer<typeof insertFeriasLicencasSchema>;

export type ServiceActivity = typeof serviceActivities.$inferSelect;
export type InsertServiceActivity = z.infer<typeof insertServiceActivitySchema>;

export type ActivityExecution = typeof activityExecutions.$inferSelect;
export type InsertActivityExecution = z.infer<typeof insertActivityExecutionSchema>;

export type ActivityExecutionAttachment = typeof activityExecutionAttachments.$inferSelect;
export type InsertActivityExecutionAttachment = z.infer<typeof insertActivityExecutionAttachmentSchema>;

// RELATIONS (extended types)
export type EmployeeWithRelations = Employee & {
  linkedPost?: ServicePost | null;
};

export type AllocationWithRelations = Allocation & {
  employee?: Employee | null;
  post?: ServicePost | null;
};

export type OccurrenceWithRelations = Occurrence & {
  employee?: Employee | null;
  post?: ServicePost | null;
  treatedByUser?: User | null;
};

export type DocumentWithRelations = Document & {
  employee?: Employee | null;
  post?: ServicePost | null;
  uploader?: User | null;
};

export type AuditLogWithRelations = AuditLog & {
  user?: User | null;
};

export type NotificationSettingsWithRelations = any;

export type AlertWithRelations = Alert & {
  resolver?: User | null;
};

export type LgpdLogWithRelations = LgpdLog & {
  user?: User | null;
};

export type DocumentChecklistWithRelations = DocumentChecklist & {
  employee?: Employee | null;
  post?: ServicePost | null;
};

export type FeriasLicencasWithRelations = FeriasLicencas & {
  employee?: Employee | null;
  createdByUser?: User | null;
};

export type ServiceActivityWithRelations = ServiceActivity & {
  servicePost?: ServicePost | null;
  executions?: ActivityExecution[];
};

export type ActivityExecutionWithRelations = ActivityExecution & {
  serviceActivity?: ServiceActivity | null;
  servicePost?: ServicePost | null;
  employee?: Employee | null;
  attachments?: ActivityExecutionAttachment[];
};

export type ActivityExecutionAttachmentWithRelations = ActivityExecutionAttachment & {
  execution?: ActivityExecution | null;
};
