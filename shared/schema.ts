import { sql, relations } from "drizzle-orm";

import { createInsertSchema } from "drizzle-zod";

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

// =========================
// ENUMS
// =========================
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
  "ferias", "licenca_medica", "licenca_maternidade", "licenca_paternidade",
  "licenca_nojo", "licenca_casamento", "outros"
]);
export const feriasLicencasStatusEnum = pgEnum("ferias_licencas_status", [
  "pendente", "aprovado", "rejeitado", "em_andamento", "concluido"
]);

export const activityFrequencyEnum = pgEnum("activity_frequency", [
  "daily",
  "weekly",
  "monthly",
  "on_demand"
]);

// =========================
// TABLES
// =========================

// Sessions (Replit Auth reference, optional)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("viewer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees
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

// Service Posts
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

// Allocations
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

// Occurrences
export const occurrences = pgTable("occurrences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  date: date("date").notNull(),
  employeeId: integer("employee_id").references(() => employees.id),
  postId: integer("post_id").references(() => servicePosts.id),
  description: text("description").notNull(),
  category: occurrenceCategoryEnum("category").notNull(),
  treated: boolean("treated").default(false).notNull(),
  treatedBy: varchar("treated_by").references(() => users.id),
  treatedAt: timestamp("treated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents
export const documents = pgTable("documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  size: integer("size").notNull(),
  path: varchar("path").notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  category: documentCategoryEnum("category"),
  employeeId: integer("employee_id").references(() => employees.id),
  postId: integer("post_id").references(() => servicePosts.id),
  monthYear: varchar("month_year"),
  expirationDate: date("expiration_date"),
  observations: text("observations"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  version: integer("version").default(1).notNull(),
  previousVersionId: integer("previous_version_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Checklists
export const documentChecklists = pgTable("document_checklists", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("post_id").notNull().references(() => servicePosts.id),
  documentType: documentTypeEnum("document_type").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  diffBefore: jsonb("diff_before"),
  diffAfter: jsonb("diff_after"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Alerts
export const alerts = pgTable("alerts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: alertTypeEnum("type").notNull(),
  status: alertStatusEnum("status").default("pending").notNull(),
  message: text("message").notNull(),
  entityType: varchar("entity_type"),
  entityId: integer("entity_id"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// LGPD Logs
export const lgpdLogs = pgTable("lgpd_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id),
  accessType: lgpdAccessTypeEnum("access_type").notNull(),
  dataCategory: lgpdDataCategoryEnum("data_category").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Férias e Licenças
export const feriasLicencas = pgTable("ferias_licencas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  type: feriasLicencasTypeEnum("type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: feriasLicencasStatusEnum("status").default("pendente").notNull(),
  observations: text("observations"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Activities
export const serviceActivities = pgTable("service_activities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  servicePostId: integer("service_post_id").notNull().references(() => servicePosts.id),
  name: varchar("name").notNull(),
  description: text("description"),
  ppuUnit: varchar("ppu_unit").notNull(),
  frequency: activityFrequencyEnum("frequency").notNull(),
  required: boolean("required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity Executions
export const activityExecutions = pgTable("activity_executions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  serviceActivityId: integer("service_activity_id").notNull().references(() => serviceActivities.id),
  servicePostId: integer("service_post_id").notNull().references(() => servicePosts.id),
  employeeId: integer("employee_id").references(() => employees.id),
  date: date("date").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity Execution Attachments
export const activityExecutionAttachments = pgTable("activity_execution_attachments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  activityExecutionId: integer("activity_execution_id").notNull().references(() => activityExecutions.id),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  mimeType: varchar("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// =========================
// RELATIONS
// =========================

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  auditLogs: many(auditLogs),
  resolvedAlerts: many(alerts),
  lgpdLogs: many(lgpdLogs),
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

export const serviceActivitiesRelations = relations(serviceActivities, ({ one, many }) => ({
  servicePost: one(servicePosts, {
    fields: [serviceActivities.servicePostId],
    references: [servicePosts.id],
  }),
  executions: many(activityExecutions),
}));

export const activityExecutionsRelations = relations(activityExecutions, ({ one, many }) => ({
  serviceActivity: one(serviceActivities, {
    fields: [activityExecutions.serviceActivityId],
    references: [serviceActivities.id],
  }),
  servicePost: one(servicePosts, {
    fields: [activityExecutions.servicePostId],
    references: [servicePosts.id],
  }),
  employee: one(employees, {
    fields: [activityExecutions.employeeId],
    references: [employees.id],
  }),
  attachments: many(activityExecutionAttachments),
}));

export const activityExecutionAttachmentsRelations = relations(activityExecutionAttachments, ({ one }) => ({
  execution: one(activityExecutions, {
    fields: [activityExecutionAttachments.activityExecutionId],
    references: [activityExecutions.id],
  }),
}));


// =========================
// ZOD INSERT SCHEMAS
// =========================

export const insertEmployeeSchema = createInsertSchema(employees);
export const insertServicePostSchema = createInsertSchema(servicePosts);
export const insertAllocationSchema = createInsertSchema(allocations);
export const insertOccurrenceSchema = createInsertSchema(occurrences);
export const insertDocumentChecklistSchema = createInsertSchema(documentChecklists);
export const insertFeriasLicencasSchema = createInsertSchema(feriasLicencas);
export const insertServiceActivitySchema = createInsertSchema(serviceActivities);
export const insertActivityExecutionSchema = createInsertSchema(activityExecutions);
