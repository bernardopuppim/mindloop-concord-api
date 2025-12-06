import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  date,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "admin_dica", "operator_dica", "fiscal_petrobras", "viewer"]);
export const employeeStatusEnum = pgEnum("employee_status", ["active", "inactive"]);
export const modalityEnum = pgEnum("modality", ["onsite", "hybrid", "remote"]);
export const allocationStatusEnum = pgEnum("allocation_status", ["present", "absent", "justified", "vacation", "medical_leave"]);
export const occurrenceCategoryEnum = pgEnum("occurrence_category", ["absence", "substitution", "issue", "note"]);
export const documentTypeEnum = pgEnum("document_type", ["aso", "certification", "evidence", "contract", "other"]);
export const documentCategoryEnum = pgEnum("document_category", ["atestados", "comprovantes", "relatorios_mensais", "evidencias_posto", "treinamentos", "certidoes", "outros"]);
export const alertTypeEnum = pgEnum("alert_type", ["unallocated_employee", "expired_document", "untreated_occurrence"]);
export const alertStatusEnum = pgEnum("alert_status", ["pending", "resolved"]);
export const lgpdAccessTypeEnum = pgEnum("lgpd_access_type", ["view", "export", "search"]);
export const lgpdDataCategoryEnum = pgEnum("lgpd_data_category", ["personal_data", "sensitive_data", "financial_data"]);
export const feriasLicencasTypeEnum = pgEnum("ferias_licencas_type", [
  "ferias", 
  "licenca_medica", 
  "licenca_maternidade", 
  "licenca_paternidade", 
  "licenca_nojo", 
  "licenca_casamento",
  "outros"
]);
export const feriasLicencasStatusEnum = pgEnum("ferias_licencas_status", [
  "pendente", 
  "aprovado", 
  "rejeitado", 
  "em_andamento", 
  "concluido"
]);

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - Required for Replit Auth with role extension
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("viewer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees table
export const employees = pgTable("employees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  functionPost: varchar("function_post", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 255 }).notNull(),
  status: employeeStatusEnum("status").default("active").notNull(),
  admissionDate: date("admission_date"),
  linkedPostId: integer("linked_post_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Posts table (Anexo 1A enhanced)
export const servicePosts = pgTable("service_posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postCode: varchar("post_code", { length: 50 }).notNull().unique(),
  postName: varchar("post_name", { length: 255 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 255 }).notNull(),
  modality: modalityEnum("modality").default("onsite").notNull(),
  tipoPosto: varchar("tipo_posto", { length: 100 }),
  horarioTrabalho: varchar("horario_trabalho", { length: 100 }),
  escalaRegime: varchar("escala_regime", { length: 100 }),
  quantidadePrevista: integer("quantidade_prevista"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Allocations table
export const allocations = pgTable("allocations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => servicePosts.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: allocationStatusEnum("status").default("present").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Occurrences table (enhanced with treated status)
export const occurrences = pgTable("occurrences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  date: date("date").notNull(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
  postId: integer("post_id").references(() => servicePosts.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  category: occurrenceCategoryEnum("category").notNull(),
  treated: boolean("treated").default(false).notNull(),
  treatedBy: varchar("treated_by").references(() => users.id, { onDelete: "set null" }),
  treatedAt: timestamp("treated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table (Anexo 1B enhanced with version tracking)
export const documents = pgTable("documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  path: varchar("path", { length: 500 }).notNull(),
  documentType: documentTypeEnum("document_type").default("other").notNull(),
  category: documentCategoryEnum("category").default("outros"),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
  postId: integer("post_id").references(() => servicePosts.id, { onDelete: "set null" }),
  monthYear: varchar("month_year", { length: 7 }),
  expirationDate: date("expiration_date"),
  observations: text("observations"),
  uploadedBy: varchar("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  version: integer("version").default(1).notNull(),
  previousVersionId: integer("previous_version_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Checklists table (required documents per posto)
export const documentChecklists = pgTable("document_checklists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("post_id").notNull().references(() => servicePosts.id, { onDelete: "cascade" }),
  documentType: documentTypeEnum("document_type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Logs table (enhanced with diff tracking)
export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  details: jsonb("details"),
  diffBefore: jsonb("diff_before"),
  diffAfter: jsonb("diff_after"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Notification Settings table
export const notificationSettings = pgTable("notification_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  notifyNewOccurrences: boolean("notify_new_occurrences").default(true).notNull(),
  notifyMissingAllocations: boolean("notify_missing_allocations").default(true).notNull(),
  notifyDocumentExpiration: boolean("notify_document_expiration").default(true).notNull(),
  notifyDailySummary: boolean("notify_daily_summary").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alerts table (for workflows)
export const alerts = pgTable("alerts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: alertTypeEnum("type").notNull(),
  status: alertStatusEnum("status").default("pending").notNull(),
  message: text("message").notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: integer("entity_id"),
  resolvedBy: varchar("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// LGPD Logs table (for data protection compliance)
export const lgpdLogs = pgTable("lgpd_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  accessType: lgpdAccessTypeEnum("access_type").notNull(),
  dataCategory: lgpdDataCategoryEnum("data_category").notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Férias e Licenças table
export const feriasLicencas = pgTable("ferias_licencas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  type: feriasLicencasTypeEnum("type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: feriasLicencasStatusEnum("status").default("pendente").notNull(),
  observations: text("observations"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  auditLogs: many(auditLogs),
  notificationSettings: many(notificationSettings),
  resolvedAlerts: many(alerts),
  lgpdLogs: many(lgpdLogs),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  linkedPost: one(servicePosts, {
    fields: [employees.linkedPostId],
    references: [servicePosts.id],
  }),
  allocations: many(allocations),
  occurrences: many(occurrences),
  documents: many(documents),
  feriasLicencas: many(feriasLicencas),
}));

export const servicePostsRelations = relations(servicePosts, ({ many }) => ({
  allocations: many(allocations),
  documents: many(documents),
  checklists: many(documentChecklists),
}));

export const documentChecklistsRelations = relations(documentChecklists, ({ one }) => ({
  post: one(servicePosts, {
    fields: [documentChecklists.postId],
    references: [servicePosts.id],
  }),
}));

export const allocationsRelations = relations(allocations, ({ one }) => ({
  employee: one(employees, {
    fields: [allocations.employeeId],
    references: [employees.id],
  }),
  post: one(servicePosts, {
    fields: [allocations.postId],
    references: [servicePosts.id],
  }),
}));

export const occurrencesRelations = relations(occurrences, ({ one }) => ({
  employee: one(employees, {
    fields: [occurrences.employeeId],
    references: [employees.id],
  }),
  post: one(servicePosts, {
    fields: [occurrences.postId],
    references: [servicePosts.id],
  }),
  treatedByUser: one(users, {
    fields: [occurrences.treatedBy],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  employee: one(employees, {
    fields: [documents.employeeId],
    references: [employees.id],
  }),
  post: one(servicePosts, {
    fields: [documents.postId],
    references: [servicePosts.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  resolver: one(users, {
    fields: [alerts.resolvedBy],
    references: [users.id],
  }),
}));

export const lgpdLogsRelations = relations(lgpdLogs, ({ one }) => ({
  user: one(users, {
    fields: [lgpdLogs.userId],
    references: [users.id],
  }),
}));

export const feriasLicencasRelations = relations(feriasLicencas, ({ one }) => ({
  employee: one(employees, {
    fields: [feriasLicencas.employeeId],
    references: [employees.id],
  }),
  createdByUser: one(users, {
    fields: [feriasLicencas.createdBy],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato XXX.XXX.XXX-XX"),
});

export const insertServicePostSchema = createInsertSchema(servicePosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAllocationSchema = createInsertSchema(allocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOccurrenceSchema = createInsertSchema(occurrences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  treated: true,
  treatedBy: true,
  treatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  resolvedBy: true,
  resolvedAt: true,
});

export const insertLgpdLogSchema = createInsertSchema(lgpdLogs).omit({
  id: true,
  timestamp: true,
});

export const insertDocumentChecklistSchema = createInsertSchema(documentChecklists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeriasLicencasSchema = createInsertSchema(feriasLicencas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertServicePost = z.infer<typeof insertServicePostSchema>;
export type ServicePost = typeof servicePosts.$inferSelect;
export type InsertAllocation = z.infer<typeof insertAllocationSchema>;
export type Allocation = typeof allocations.$inferSelect;
export type InsertOccurrence = z.infer<typeof insertOccurrenceSchema>;
export type Occurrence = typeof occurrences.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertLgpdLog = z.infer<typeof insertLgpdLogSchema>;
export type LgpdLog = typeof lgpdLogs.$inferSelect;

// Extended types with relations
export type EmployeeWithRelations = Employee & {
  linkedPost?: ServicePost | null;
};

export type AllocationWithRelations = Allocation & {
  employee?: Employee;
  post?: ServicePost;
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

export type NotificationSettingsWithRelations = NotificationSettings & {
  user?: User | null;
};

export type AlertWithRelations = Alert & {
  resolver?: User | null;
};

export type LgpdLogWithRelations = LgpdLog & {
  user?: User | null;
};

export type InsertDocumentChecklist = z.infer<typeof insertDocumentChecklistSchema>;
export type DocumentChecklist = typeof documentChecklists.$inferSelect;

export type DocumentChecklistWithRelations = DocumentChecklist & {
  post?: ServicePost | null;
};

export type InsertFeriasLicencas = z.infer<typeof insertFeriasLicencasSchema>;
export type FeriasLicencas = typeof feriasLicencas.$inferSelect;

export type FeriasLicencasWithRelations = FeriasLicencas & {
  employee?: Employee | null;
  createdByUser?: User | null;
};
