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
export const userRoleEnum = pgEnum("user_role", ["admin", "viewer"]);
export const employeeStatusEnum = pgEnum("employee_status", ["active", "inactive"]);
export const modalityEnum = pgEnum("modality", ["onsite", "hybrid", "remote"]);
export const allocationStatusEnum = pgEnum("allocation_status", ["present", "absent", "justified", "vacation", "medical_leave"]);
export const occurrenceCategoryEnum = pgEnum("occurrence_category", ["absence", "substitution", "issue", "note"]);
export const documentTypeEnum = pgEnum("document_type", ["aso", "certification", "evidence", "contract", "other"]);

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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Posts table
export const servicePosts = pgTable("service_posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postCode: varchar("post_code", { length: 50 }).notNull().unique(),
  postName: varchar("post_name", { length: 255 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 255 }).notNull(),
  modality: modalityEnum("modality").default("onsite").notNull(),
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

// Occurrences table
export const occurrences = pgTable("occurrences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  date: date("date").notNull(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  category: occurrenceCategoryEnum("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  path: varchar("path", { length: 500 }).notNull(),
  documentType: documentTypeEnum("document_type").default("other").notNull(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
  postId: integer("post_id").references(() => servicePosts.id, { onDelete: "set null" }),
  monthYear: varchar("month_year", { length: 7 }),
  expirationDate: date("expiration_date"),
  uploadedBy: varchar("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  details: jsonb("details"),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  auditLogs: many(auditLogs),
  notificationSettings: many(notificationSettings),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}));

export const employeesRelations = relations(employees, ({ many }) => ({
  allocations: many(allocations),
  occurrences: many(occurrences),
  documents: many(documents),
}));

export const servicePostsRelations = relations(servicePosts, ({ many }) => ({
  allocations: many(allocations),
  documents: many(documents),
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
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF must be in format XXX.XXX.XXX-XX"),
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

// Extended types with relations
export type AllocationWithRelations = Allocation & {
  employee?: Employee;
  post?: ServicePost;
};

export type OccurrenceWithRelations = Occurrence & {
  employee?: Employee | null;
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
