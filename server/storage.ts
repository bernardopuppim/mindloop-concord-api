import {
  users,
  employees,
  servicePosts,
  allocations,
  occurrences,
  documents,
  auditLogs,
  notificationSettings,
  lgpdLogs,
  documentChecklists,
  feriasLicencas,
  serviceActivities,
  activityExecutions,
  activityExecutionAttachments,
  type User,
  type UpsertUser,
  type Employee,
  type InsertEmployee,
  type ServicePost,
  type InsertServicePost,
  type Allocation,
  type InsertAllocation,
  type AllocationWithRelations,
  type Occurrence,
  type InsertOccurrence,
  type OccurrenceWithRelations,
  type Document,
  type InsertDocument,
  type DocumentWithRelations,
  type AuditLog,
  type InsertAuditLog,
  type AuditLogWithRelations,
  type NotificationSettings,
  type InsertNotificationSettings,
  type NotificationSettingsWithRelations,
  type LgpdLog,
  type InsertLgpdLog,
  type LgpdLogWithRelations,
  type DocumentChecklist,
  type InsertDocumentChecklist,
  type DocumentChecklistWithRelations,
  type FeriasLicencas,
  type InsertFeriasLicencas,
  type FeriasLicencasWithRelations,
  type ServiceActivity,
  type InsertServiceActivity,
  type ServiceActivityWithRelations,
  type ActivityExecution,
  type InsertActivityExecution,
  type ActivityExecutionWithRelations,
  type ActivityExecutionAttachment,
  type InsertActivityExecutionAttachment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, gte, lte, or, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: "admin" | "viewer"): Promise<User | undefined>;

  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  searchEmployees(query: string): Promise<Employee[]>;

  getServicePosts(): Promise<ServicePost[]>;
  getServicePost(id: number): Promise<ServicePost | undefined>;
  createServicePost(post: InsertServicePost): Promise<ServicePost>;
  updateServicePost(id: number, post: Partial<InsertServicePost>): Promise<ServicePost | undefined>;
  deleteServicePost(id: number): Promise<boolean>;
  searchServicePosts(query: string): Promise<ServicePost[]>;

  getAllocations(filters?: { date?: string; employeeId?: number; postId?: number }): Promise<AllocationWithRelations[]>;
  getAllocation(id: number): Promise<AllocationWithRelations | undefined>;
  createAllocation(allocation: InsertAllocation): Promise<Allocation>;
  updateAllocation(id: number, allocation: Partial<InsertAllocation>): Promise<Allocation | undefined>;
  deleteAllocation(id: number): Promise<boolean>;
  getAllocationsByDateRange(startDate: string, endDate: string): Promise<AllocationWithRelations[]>;
  getAllocationsByDateRangeAndPost(startDate: string, endDate: string, postId: number): Promise<AllocationWithRelations[]>;
  bulkCreateAllocations(allocations: InsertAllocation[]): Promise<Allocation[]>;
  deleteAllocationsByDateRangeAndPost(startDate: string, endDate: string, postId: number): Promise<number>;

  getOccurrences(filters?: { startDate?: string; endDate?: string; category?: string; employeeId?: number }): Promise<OccurrenceWithRelations[]>;
  getOccurrence(id: number): Promise<OccurrenceWithRelations | undefined>;
  createOccurrence(occurrence: InsertOccurrence): Promise<Occurrence>;
  updateOccurrence(id: number, occurrence: Partial<InsertOccurrence>): Promise<Occurrence | undefined>;
  deleteOccurrence(id: number): Promise<boolean>;

  getDocuments(filters?: { documentType?: string; employeeId?: number; postId?: number; monthYear?: string }): Promise<DocumentWithRelations[]>;
  getDocument(id: number): Promise<DocumentWithRelations | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  getExpiringDocuments(daysAhead?: number): Promise<DocumentWithRelations[]>;
  getExpiredDocuments(): Promise<DocumentWithRelations[]>;

  getAuditLogs(limit?: number): Promise<AuditLogWithRelations[]>;
  getAuditLogsFiltered(filters?: { userId?: string; entityType?: string; action?: string; startDate?: string; endDate?: string; limit?: number }): Promise<AuditLogWithRelations[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  createAuditLogWithDiff(log: InsertAuditLog & { diffBefore?: any; diffAfter?: any }): Promise<AuditLog>;

  getDashboardStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    totalServicePosts: number;
    totalDocuments: number;
    recentOccurrences: number;
  }>;

  getAllocationTrends(days?: number): Promise<Array<{
    date: string;
    present: number;
    absent: number;
    justified: number;
    vacation: number;
    medical_leave: number;
  }>>;

  getOccurrencesByCategory(): Promise<Array<{
    category: string;
    count: number;
  }>>;

  getComplianceMetrics(): Promise<{
    attendanceRate: number;
    documentationRate: number;
    activeEmployeeRate: number;
    occurrenceRate: number;
  }>;

  getNotificationSettings(): Promise<NotificationSettingsWithRelations[]>;
  getNotificationSettingsByUser(userId: string): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(id: number, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined>;
  deleteNotificationSettings(id: number): Promise<boolean>;
  getActiveNotificationRecipients(notificationType: 'occurrences' | 'allocations' | 'documents' | 'daily'): Promise<string[]>;

  createLgpdLog(log: InsertLgpdLog): Promise<LgpdLog>;
  getLgpdLogsFiltered(filters?: { userId?: string; accessType?: string; dataCategory?: string; entityType?: string; startDate?: string; endDate?: string; limit?: number }): Promise<LgpdLogWithRelations[]>;

  getPrevistoRealizadoReport(filters: { startDate: string; endDate: string; postId?: number }): Promise<{
    summary: { totalPrevisto: number; totalRealizado: number; compliancePercentage: number };
    byPost: Array<{
      postId: number;
      postCode: string;
      postName: string;
      previsto: number;
      realizado: number;
      compliance: number;
    }>;
    byDate: Array<{
      date: string;
      previsto: number;
      realizado: number;
    }>;
  }>;

  // Document Checklists
  getDocumentChecklists(postId?: number): Promise<DocumentChecklistWithRelations[]>;
  getDocumentChecklist(id: number): Promise<DocumentChecklistWithRelations | undefined>;
  createDocumentChecklist(checklist: InsertDocumentChecklist): Promise<DocumentChecklist>;
  updateDocumentChecklist(id: number, checklist: Partial<InsertDocumentChecklist>): Promise<DocumentChecklist | undefined>;
  deleteDocumentChecklist(id: number): Promise<boolean>;
  getChecklistComplianceByPost(postId: number): Promise<{
    checklist: DocumentChecklist;
    fulfilled: boolean;
    latestDocument: Document | null;
  }[]>;

  // Document Version Tracking
  getDocumentVersions(documentId: number): Promise<DocumentWithRelations[]>;
  createDocumentVersion(originalDocId: number, newDocument: InsertDocument): Promise<Document>;

  // Férias & Licenças
  getFeriasLicencas(filters?: { employeeId?: number; type?: string; status?: string }): Promise<FeriasLicencasWithRelations[]>;
  getFeriasLicenca(id: number): Promise<FeriasLicencasWithRelations | undefined>;
  createFeriasLicenca(data: InsertFeriasLicencas): Promise<FeriasLicencas>;
  updateFeriasLicenca(id: number, data: Partial<InsertFeriasLicencas>): Promise<FeriasLicencas | undefined>;
  deleteFeriasLicenca(id: number): Promise<boolean>;
  getActiveFeriasLicencas(): Promise<FeriasLicencasWithRelations[]>;

  // Service Activities
  getServiceActivities(postId?: number): Promise<ServiceActivityWithRelations[]>;
  getServiceActivity(id: number): Promise<ServiceActivityWithRelations | undefined>;
  createServiceActivity(activity: InsertServiceActivity): Promise<ServiceActivity>;
  updateServiceActivity(id: number, activity: Partial<InsertServiceActivity>): Promise<ServiceActivity | undefined>;
  deleteServiceActivity(id: number): Promise<boolean>;

  // Activity Executions
  getActivityExecutions(filters?: { servicePostId?: number; serviceActivityId?: number; employeeId?: number; startDate?: string; endDate?: string }): Promise<ActivityExecutionWithRelations[]>;
  getActivityExecution(id: number): Promise<ActivityExecutionWithRelations | undefined>;
  createActivityExecution(execution: InsertActivityExecution): Promise<ActivityExecution>;
  updateActivityExecution(id: number, execution: Partial<InsertActivityExecution>): Promise<ActivityExecution | undefined>;
  deleteActivityExecution(id: number): Promise<boolean>;
  bulkUpsertActivityExecutions(executions: InsertActivityExecution[]): Promise<ActivityExecution[]>;

  // Activity Execution Attachments
  getActivityExecutionAttachments(executionId: number): Promise<ActivityExecutionAttachment[]>;
  getActivityExecutionAttachment(id: number): Promise<ActivityExecutionAttachment | undefined>;
  createActivityExecutionAttachment(attachment: InsertActivityExecutionAttachment): Promise<ActivityExecutionAttachment>;
  deleteActivityExecutionAttachment(id: number): Promise<boolean>;

  // Activity Execution Report
  getActivityExecutionReport(filters: { startDate: string; endDate: string; servicePostId?: number }): Promise<{
    summary: { totalActivities: number; totalExecutions: number; totalQuantity: number };
    byPost: Array<{
      postId: number;
      postCode: string;
      postName: string;
      activityCount: number;
      executionCount: number;
      totalQuantity: number;
    }>;
    byActivity: Array<{
      activityId: number;
      activityName: string;
      ppuUnit: string;
      executionCount: number;
      totalQuantity: number;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: "admin" | "viewer"): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees).orderBy(employees.name);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values(employee).returning();
    return created;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updated] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updated;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    const searchTerm = `%${query}%`;
    return db
      .select()
      .from(employees)
      .where(
        or(
          like(employees.name, searchTerm),
          like(employees.cpf, searchTerm),
          like(employees.functionPost, searchTerm),
          like(employees.unit, searchTerm)
        )
      )
      .orderBy(employees.name);
  }

  async getServicePosts(): Promise<ServicePost[]> {
    return db.select().from(servicePosts).orderBy(servicePosts.postCode);
  }

  async getServicePost(id: number): Promise<ServicePost | undefined> {
    const [post] = await db.select().from(servicePosts).where(eq(servicePosts.id, id));
    return post;
  }

  async createServicePost(post: InsertServicePost): Promise<ServicePost> {
    const [created] = await db.insert(servicePosts).values(post).returning();
    return created;
  }

  async updateServicePost(id: number, post: Partial<InsertServicePost>): Promise<ServicePost | undefined> {
    const [updated] = await db
      .update(servicePosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(servicePosts.id, id))
      .returning();
    return updated;
  }

  async deleteServicePost(id: number): Promise<boolean> {
    const result = await db.delete(servicePosts).where(eq(servicePosts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchServicePosts(query: string): Promise<ServicePost[]> {
    const searchTerm = `%${query}%`;
    return db
      .select()
      .from(servicePosts)
      .where(
        or(
          like(servicePosts.postCode, searchTerm),
          like(servicePosts.postName, searchTerm),
          like(servicePosts.unit, searchTerm)
        )
      )
      .orderBy(servicePosts.postCode);
  }

  async getAllocations(filters?: { date?: string; employeeId?: number; postId?: number }): Promise<AllocationWithRelations[]> {
    const conditions = [];
    if (filters?.date) conditions.push(eq(allocations.date, filters.date));
    if (filters?.employeeId) conditions.push(eq(allocations.employeeId, filters.employeeId));
    if (filters?.postId) conditions.push(eq(allocations.postId, filters.postId));

    const result = await db.query.allocations.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        employee: true,
        post: true,
      },
      orderBy: [desc(allocations.date)],
    });
    return result;
  }

  async getAllocation(id: number): Promise<AllocationWithRelations | undefined> {
    const result = await db.query.allocations.findFirst({
      where: eq(allocations.id, id),
      with: {
        employee: true,
        post: true,
      },
    });
    return result;
  }

  async createAllocation(allocation: InsertAllocation): Promise<Allocation> {
    const [created] = await db.insert(allocations).values(allocation).returning();
    return created;
  }

  async updateAllocation(id: number, allocation: Partial<InsertAllocation>): Promise<Allocation | undefined> {
    const [updated] = await db
      .update(allocations)
      .set({ ...allocation, updatedAt: new Date() })
      .where(eq(allocations.id, id))
      .returning();
    return updated;
  }

  async deleteAllocation(id: number): Promise<boolean> {
    const result = await db.delete(allocations).where(eq(allocations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllocationsByDateRange(startDate: string, endDate: string): Promise<AllocationWithRelations[]> {
    const result = await db.query.allocations.findMany({
      where: and(
        gte(allocations.date, startDate),
        lte(allocations.date, endDate)
      ),
      with: {
        employee: true,
        post: true,
      },
      orderBy: [allocations.date, allocations.employeeId],
    });
    return result;
  }

  async getAllocationsByDateRangeAndPost(startDate: string, endDate: string, postId: number): Promise<AllocationWithRelations[]> {
    const result = await db.query.allocations.findMany({
      where: and(
        gte(allocations.date, startDate),
        lte(allocations.date, endDate),
        eq(allocations.postId, postId)
      ),
      with: {
        employee: true,
        post: true,
      },
      orderBy: [allocations.date, allocations.employeeId],
    });
    return result;
  }

  async bulkCreateAllocations(allocationData: InsertAllocation[]): Promise<Allocation[]> {
    if (allocationData.length === 0) return [];
    const created = await db.insert(allocations).values(allocationData).returning();
    return created;
  }

  async deleteAllocationsByDateRangeAndPost(startDate: string, endDate: string, postId: number): Promise<number> {
    const result = await db.delete(allocations).where(
      and(
        gte(allocations.date, startDate),
        lte(allocations.date, endDate),
        eq(allocations.postId, postId)
      )
    );
    return result.rowCount ?? 0;
  }

  async getOccurrences(filters?: { startDate?: string; endDate?: string; category?: string; employeeId?: number }): Promise<OccurrenceWithRelations[]> {
    const conditions = [];
    if (filters?.startDate) conditions.push(gte(occurrences.date, filters.startDate));
    if (filters?.endDate) conditions.push(lte(occurrences.date, filters.endDate));
    if (filters?.category) conditions.push(eq(occurrences.category, filters.category as any));
    if (filters?.employeeId) conditions.push(eq(occurrences.employeeId, filters.employeeId));

    const result = await db.query.occurrences.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        employee: true,
      },
      orderBy: [desc(occurrences.date)],
    });
    return result;
  }

  async getOccurrence(id: number): Promise<OccurrenceWithRelations | undefined> {
    const result = await db.query.occurrences.findFirst({
      where: eq(occurrences.id, id),
      with: {
        employee: true,
      },
    });
    return result;
  }

  async createOccurrence(occurrence: InsertOccurrence): Promise<Occurrence> {
    const [created] = await db.insert(occurrences).values(occurrence).returning();
    return created;
  }

  async updateOccurrence(id: number, occurrence: Partial<InsertOccurrence>): Promise<Occurrence | undefined> {
    const [updated] = await db
      .update(occurrences)
      .set({ ...occurrence, updatedAt: new Date() })
      .where(eq(occurrences.id, id))
      .returning();
    return updated;
  }

  async deleteOccurrence(id: number): Promise<boolean> {
    const result = await db.delete(occurrences).where(eq(occurrences.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getDocuments(filters?: { documentType?: string; employeeId?: number; postId?: number; monthYear?: string }): Promise<DocumentWithRelations[]> {
    const conditions = [];
    if (filters?.documentType) conditions.push(eq(documents.documentType, filters.documentType as any));
    if (filters?.employeeId) conditions.push(eq(documents.employeeId, filters.employeeId));
    if (filters?.postId) conditions.push(eq(documents.postId, filters.postId));
    if (filters?.monthYear) conditions.push(eq(documents.monthYear, filters.monthYear));

    const result = await db.query.documents.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        employee: true,
        post: true,
        uploader: true,
      },
      orderBy: [desc(documents.createdAt)],
    });
    return result;
  }

  async getDocument(id: number): Promise<DocumentWithRelations | undefined> {
    const result = await db.query.documents.findFirst({
      where: eq(documents.id, id),
      with: {
        employee: true,
        post: true,
        uploader: true,
      },
    });
    return result;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(document).returning();
    return created;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async getExpiringDocuments(daysAhead: number = 30): Promise<DocumentWithRelations[]> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const result = await db.query.documents.findMany({
      where: and(
        sql`${documents.expirationDate} IS NOT NULL`,
        gte(documents.expirationDate, today),
        lte(documents.expirationDate, futureDateStr)
      ),
      with: {
        employee: true,
        post: true,
        uploader: true,
      },
      orderBy: [documents.expirationDate],
    });
    return result;
  }

  async getExpiredDocuments(): Promise<DocumentWithRelations[]> {
    const today = new Date().toISOString().split('T')[0];

    const result = await db.query.documents.findMany({
      where: and(
        sql`${documents.expirationDate} IS NOT NULL`,
        lte(documents.expirationDate, today)
      ),
      with: {
        employee: true,
        post: true,
        uploader: true,
      },
      orderBy: [desc(documents.expirationDate)],
    });
    return result;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLogWithRelations[]> {
    const result = await db.query.auditLogs.findMany({
      with: {
        user: true,
      },
      orderBy: [desc(auditLogs.timestamp)],
      limit,
    });
    return result;
  }

  async getAuditLogsFiltered(filters?: { userId?: string; entityType?: string; action?: string; startDate?: string; endDate?: string; limit?: number }): Promise<AuditLogWithRelations[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
    if (filters?.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters?.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters?.startDate) conditions.push(gte(auditLogs.timestamp, new Date(filters.startDate)));
    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(auditLogs.timestamp, endDate));
    }

    const result = await db.query.auditLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: true,
      },
      orderBy: [desc(auditLogs.timestamp)],
      limit: filters?.limit || 500,
    });
    return result;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async createAuditLogWithDiff(log: InsertAuditLog & { diffBefore?: any; diffAfter?: any }): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values({
      ...log,
      diffBefore: log.diffBefore || null,
      diffAfter: log.diffAfter || null,
    } as any).returning();
    return created;
  }

  async getDashboardStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    totalServicePosts: number;
    totalDocuments: number;
    recentOccurrences: number;
  }> {
    const [employeeStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${employees.status} = 'active')`,
      })
      .from(employees);

    const [postStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(servicePosts);

    const [docStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [occurrenceStats] = await db
      .select({ count: sql<number>`count(*)` })
      .from(occurrences)
      .where(gte(occurrences.date, thirtyDaysAgo.toISOString().split('T')[0]));

    return {
      totalEmployees: Number(employeeStats?.total) || 0,
      activeEmployees: Number(employeeStats?.active) || 0,
      totalServicePosts: Number(postStats?.count) || 0,
      totalDocuments: Number(docStats?.count) || 0,
      recentOccurrences: Number(occurrenceStats?.count) || 0,
    };
  }

  async getAllocationTrends(days: number = 30): Promise<Array<{
    date: string;
    present: number;
    absent: number;
    justified: number;
    vacation: number;
    medical_leave: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const result = await db
      .select({
        date: allocations.date,
        present: sql<number>`count(*) filter (where ${allocations.status} = 'present')`,
        absent: sql<number>`count(*) filter (where ${allocations.status} = 'absent')`,
        justified: sql<number>`count(*) filter (where ${allocations.status} = 'justified')`,
        vacation: sql<number>`count(*) filter (where ${allocations.status} = 'vacation')`,
        medical_leave: sql<number>`count(*) filter (where ${allocations.status} = 'medical_leave')`,
      })
      .from(allocations)
      .where(gte(allocations.date, startDateStr))
      .groupBy(allocations.date)
      .orderBy(allocations.date);

    return result.map(row => ({
      date: row.date,
      present: Number(row.present) || 0,
      absent: Number(row.absent) || 0,
      justified: Number(row.justified) || 0,
      vacation: Number(row.vacation) || 0,
      medical_leave: Number(row.medical_leave) || 0,
    }));
  }

  async getOccurrencesByCategory(): Promise<Array<{
    category: string;
    count: number;
  }>> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const result = await db
      .select({
        category: occurrences.category,
        count: sql<number>`count(*)`,
      })
      .from(occurrences)
      .where(gte(occurrences.date, startDateStr))
      .groupBy(occurrences.category);

    return result.map(row => ({
      category: row.category,
      count: Number(row.count) || 0,
    }));
  }

  async getComplianceMetrics(): Promise<{
    attendanceRate: number;
    documentationRate: number;
    activeEmployeeRate: number;
    occurrenceRate: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const [allocationStats] = await db
      .select({
        total: sql<number>`count(*)`,
        present: sql<number>`count(*) filter (where ${allocations.status} = 'present')`,
      })
      .from(allocations)
      .where(gte(allocations.date, startDateStr));

    const [employeeStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where ${employees.status} = 'active')`,
      })
      .from(employees);

    const [docStats] = await db
      .select({
        employeesWithDocs: sql<number>`count(distinct ${documents.employeeId})`,
      })
      .from(documents);

    const [occurrenceStats] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(occurrences)
      .where(gte(occurrences.date, startDateStr));

    const totalAllocations = Number(allocationStats?.total) || 0;
    const presentAllocations = Number(allocationStats?.present) || 0;
    const totalEmployees = Number(employeeStats?.total) || 0;
    const activeEmployees = Number(employeeStats?.active) || 0;
    const employeesWithDocs = Number(docStats?.employeesWithDocs) || 0;
    const occurrenceCount = Number(occurrenceStats?.count) || 0;

    const safeDiv = (numerator: number, denominator: number, multiplier: number = 100) => {
      if (denominator <= 0) return 0;
      return Math.round((numerator / denominator) * multiplier);
    };

    return {
      attendanceRate: safeDiv(presentAllocations, totalAllocations),
      documentationRate: safeDiv(employeesWithDocs, totalEmployees),
      activeEmployeeRate: safeDiv(activeEmployees, totalEmployees),
      occurrenceRate: activeEmployees > 0 ? Math.round((occurrenceCount / activeEmployees) * 10) / 10 : 0,
    };
  }

  async getNotificationSettings(): Promise<NotificationSettingsWithRelations[]> {
    const result = await db.query.notificationSettings.findMany({
      with: {
        user: true,
      },
      orderBy: [desc(notificationSettings.createdAt)],
    });
    return result;
  }

  async getNotificationSettingsByUser(userId: string): Promise<NotificationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
    return settings;
  }

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const [created] = await db.insert(notificationSettings).values(settings).returning();
    return created;
  }

  async updateNotificationSettings(id: number, settings: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> {
    const [updated] = await db
      .update(notificationSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(notificationSettings.id, id))
      .returning();
    return updated;
  }

  async deleteNotificationSettings(id: number): Promise<boolean> {
    const result = await db.delete(notificationSettings).where(eq(notificationSettings.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getActiveNotificationRecipients(notificationType: 'occurrences' | 'allocations' | 'documents' | 'daily'): Promise<string[]> {
    let condition;
    switch (notificationType) {
      case 'occurrences':
        condition = eq(notificationSettings.notifyNewOccurrences, true);
        break;
      case 'allocations':
        condition = eq(notificationSettings.notifyMissingAllocations, true);
        break;
      case 'documents':
        condition = eq(notificationSettings.notifyDocumentExpiration, true);
        break;
      case 'daily':
        condition = eq(notificationSettings.notifyDailySummary, true);
        break;
    }

    const settings = await db
      .select({ email: notificationSettings.email })
      .from(notificationSettings)
      .where(and(eq(notificationSettings.isActive, true), condition));

    return settings.map(s => s.email);
  }

  async createLgpdLog(log: InsertLgpdLog): Promise<LgpdLog> {
    const [created] = await db.insert(lgpdLogs).values(log).returning();
    return created;
  }

  async getLgpdLogsFiltered(filters?: { userId?: string; accessType?: string; dataCategory?: string; entityType?: string; startDate?: string; endDate?: string; limit?: number }): Promise<LgpdLogWithRelations[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(lgpdLogs.userId, filters.userId));
    if (filters?.accessType) conditions.push(eq(lgpdLogs.accessType, filters.accessType as any));
    if (filters?.dataCategory) conditions.push(eq(lgpdLogs.dataCategory, filters.dataCategory as any));
    if (filters?.entityType) conditions.push(eq(lgpdLogs.entityType, filters.entityType));
    if (filters?.startDate) conditions.push(gte(lgpdLogs.timestamp, new Date(filters.startDate)));
    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(lgpdLogs.timestamp, endDate));
    }

    const result = await db.query.lgpdLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: true,
      },
      orderBy: [desc(lgpdLogs.timestamp)],
      limit: filters?.limit || 500,
    });
    return result;
  }

  async getPrevistoRealizadoReport(filters: { startDate: string; endDate: string; postId?: number }): Promise<{
    summary: { totalPrevisto: number; totalRealizado: number; compliancePercentage: number };
    byPost: Array<{
      postId: number;
      postCode: string;
      postName: string;
      previsto: number;
      realizado: number;
      compliance: number;
    }>;
    byDate: Array<{
      date: string;
      previsto: number;
      realizado: number;
    }>;
  }> {
    const conditions = [
      gte(allocations.date, filters.startDate),
      lte(allocations.date, filters.endDate),
    ];
    if (filters.postId) {
      conditions.push(eq(allocations.postId, filters.postId));
    }

    const byPostResult = await db
      .select({
        postId: allocations.postId,
        postCode: servicePosts.postCode,
        postName: servicePosts.postName,
        previsto: sql<number>`count(*)`,
        realizado: sql<number>`count(*) filter (where ${allocations.status} = 'present')`,
      })
      .from(allocations)
      .innerJoin(servicePosts, eq(allocations.postId, servicePosts.id))
      .where(and(...conditions))
      .groupBy(allocations.postId, servicePosts.postCode, servicePosts.postName)
      .orderBy(servicePosts.postCode);

    const byDateResult = await db
      .select({
        date: allocations.date,
        previsto: sql<number>`count(*)`,
        realizado: sql<number>`count(*) filter (where ${allocations.status} = 'present')`,
      })
      .from(allocations)
      .where(and(...conditions))
      .groupBy(allocations.date)
      .orderBy(allocations.date);

    const totalPrevisto = byPostResult.reduce((sum, row) => sum + Number(row.previsto), 0);
    const totalRealizado = byPostResult.reduce((sum, row) => sum + Number(row.realizado), 0);
    const compliancePercentage = totalPrevisto > 0 ? Math.round((totalRealizado / totalPrevisto) * 100 * 10) / 10 : 0;

    return {
      summary: {
        totalPrevisto,
        totalRealizado,
        compliancePercentage,
      },
      byPost: byPostResult.map(row => ({
        postId: row.postId,
        postCode: row.postCode,
        postName: row.postName,
        previsto: Number(row.previsto),
        realizado: Number(row.realizado),
        compliance: Number(row.previsto) > 0 ? Math.round((Number(row.realizado) / Number(row.previsto)) * 100 * 10) / 10 : 0,
      })),
      byDate: byDateResult.map(row => ({
        date: row.date,
        previsto: Number(row.previsto),
        realizado: Number(row.realizado),
      })),
    };
  }

  // Document Checklists
  async getDocumentChecklists(postId?: number): Promise<DocumentChecklistWithRelations[]> {
    const conditions = postId ? [eq(documentChecklists.postId, postId)] : [];
    const result = await db.query.documentChecklists.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        post: true,
      },
      orderBy: [documentChecklists.name],
    });
    return result;
  }

  async getDocumentChecklist(id: number): Promise<DocumentChecklistWithRelations | undefined> {
    const result = await db.query.documentChecklists.findFirst({
      where: eq(documentChecklists.id, id),
      with: {
        post: true,
      },
    });
    return result;
  }

  async createDocumentChecklist(checklist: InsertDocumentChecklist): Promise<DocumentChecklist> {
    const [created] = await db.insert(documentChecklists).values(checklist).returning();
    return created;
  }

  async updateDocumentChecklist(id: number, checklist: Partial<InsertDocumentChecklist>): Promise<DocumentChecklist | undefined> {
    const [updated] = await db
      .update(documentChecklists)
      .set({ ...checklist, updatedAt: new Date() })
      .where(eq(documentChecklists.id, id))
      .returning();
    return updated;
  }

  async deleteDocumentChecklist(id: number): Promise<boolean> {
    const result = await db.delete(documentChecklists).where(eq(documentChecklists.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getChecklistComplianceByPost(postId: number): Promise<{
    checklist: DocumentChecklist;
    fulfilled: boolean;
    latestDocument: Document | null;
  }[]> {
    const checklists = await db.select().from(documentChecklists).where(eq(documentChecklists.postId, postId));
    const today = new Date().toISOString().split('T')[0];
    
    const results = await Promise.all(checklists.map(async (checklist) => {
      const [latestDoc] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.postId, postId),
            eq(documents.documentType, checklist.documentType)
          )
        )
        .orderBy(desc(documents.createdAt))
        .limit(1);
      
      const fulfilled = latestDoc !== undefined && 
        (!latestDoc.expirationDate || latestDoc.expirationDate >= today);
      
      return {
        checklist,
        fulfilled,
        latestDocument: latestDoc || null,
      };
    }));
    
    return results;
  }

  // Document Version Tracking
  async getDocumentVersions(documentId: number): Promise<DocumentWithRelations[]> {
    const doc = await this.getDocument(documentId);
    if (!doc) return [];
    
    const versions: DocumentWithRelations[] = [doc];
    let currentPreviousId: number | null = doc.previousVersionId;
    
    while (currentPreviousId) {
      const prevDoc = await this.getDocument(currentPreviousId);
      if (!prevDoc) break;
      versions.push(prevDoc);
      currentPreviousId = prevDoc.previousVersionId;
    }
    
    return versions;
  }

  async createDocumentVersion(originalDocId: number, newDocument: InsertDocument): Promise<Document> {
    const originalDoc = await this.getDocument(originalDocId);
    if (!originalDoc) {
      throw new Error("Original document not found");
    }
    
    const newVersion = (originalDoc.version || 1) + 1;
    const [created] = await db.insert(documents).values({
      ...newDocument,
      version: newVersion,
      previousVersionId: originalDocId,
    }).returning();
    
    return created;
  }

  // Férias & Licenças
  async getFeriasLicencas(filters?: { employeeId?: number; type?: string; status?: string }): Promise<FeriasLicencasWithRelations[]> {
    const conditions = [];
    if (filters?.employeeId) conditions.push(eq(feriasLicencas.employeeId, filters.employeeId));
    if (filters?.type) conditions.push(eq(feriasLicencas.type, filters.type as any));
    if (filters?.status) conditions.push(eq(feriasLicencas.status, filters.status as any));

    const result = await db.query.feriasLicencas.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        employee: true,
        createdByUser: true,
      },
      orderBy: [desc(feriasLicencas.startDate)],
    });
    return result;
  }

  async getFeriasLicenca(id: number): Promise<FeriasLicencasWithRelations | undefined> {
    const result = await db.query.feriasLicencas.findFirst({
      where: eq(feriasLicencas.id, id),
      with: {
        employee: true,
        createdByUser: true,
      },
    });
    return result;
  }

  async createFeriasLicenca(data: InsertFeriasLicencas): Promise<FeriasLicencas> {
    const [created] = await db.insert(feriasLicencas).values(data).returning();
    return created;
  }

  async updateFeriasLicenca(id: number, data: Partial<InsertFeriasLicencas>): Promise<FeriasLicencas | undefined> {
    const [updated] = await db
      .update(feriasLicencas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feriasLicencas.id, id))
      .returning();
    return updated;
  }

  async deleteFeriasLicenca(id: number): Promise<boolean> {
    const result = await db.delete(feriasLicencas).where(eq(feriasLicencas.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getActiveFeriasLicencas(): Promise<FeriasLicencasWithRelations[]> {
    const today = new Date().toISOString().split('T')[0];
    const result = await db.query.feriasLicencas.findMany({
      where: and(
        lte(feriasLicencas.startDate, today),
        gte(feriasLicencas.endDate, today),
        or(
          eq(feriasLicencas.status, 'aprovado'),
          eq(feriasLicencas.status, 'em_andamento')
        )
      ),
      with: {
        employee: true,
        createdByUser: true,
      },
      orderBy: [feriasLicencas.endDate],
    });
    return result;
  }

  // Service Activities
  async getServiceActivities(postId?: number): Promise<ServiceActivityWithRelations[]> {
    const result = await db.query.serviceActivities.findMany({
      where: postId ? eq(serviceActivities.servicePostId, postId) : undefined,
      with: {
        servicePost: true,
      },
      orderBy: [serviceActivities.name],
    });
    return result;
  }

  async getServiceActivity(id: number): Promise<ServiceActivityWithRelations | undefined> {
    const result = await db.query.serviceActivities.findFirst({
      where: eq(serviceActivities.id, id),
      with: {
        servicePost: true,
      },
    });
    return result;
  }

  async createServiceActivity(activity: InsertServiceActivity): Promise<ServiceActivity> {
    const [created] = await db.insert(serviceActivities).values(activity).returning();
    return created;
  }

  async updateServiceActivity(id: number, activity: Partial<InsertServiceActivity>): Promise<ServiceActivity | undefined> {
    const [updated] = await db
      .update(serviceActivities)
      .set({ ...activity, updatedAt: new Date() })
      .where(eq(serviceActivities.id, id))
      .returning();
    return updated;
  }

  async deleteServiceActivity(id: number): Promise<boolean> {
    const result = await db.delete(serviceActivities).where(eq(serviceActivities.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Activity Executions
  async getActivityExecutions(filters?: { servicePostId?: number; serviceActivityId?: number; employeeId?: number; startDate?: string; endDate?: string }): Promise<ActivityExecutionWithRelations[]> {
    const conditions = [];
    if (filters?.servicePostId) conditions.push(eq(activityExecutions.servicePostId, filters.servicePostId));
    if (filters?.serviceActivityId) conditions.push(eq(activityExecutions.serviceActivityId, filters.serviceActivityId));
    if (filters?.employeeId) conditions.push(eq(activityExecutions.employeeId, filters.employeeId));
    if (filters?.startDate) conditions.push(gte(activityExecutions.date, filters.startDate));
    if (filters?.endDate) conditions.push(lte(activityExecutions.date, filters.endDate));

    const result = await db.query.activityExecutions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        serviceActivity: true,
        servicePost: true,
        employee: true,
        attachments: true,
      },
      orderBy: [desc(activityExecutions.date)],
    });
    return result;
  }

  async getActivityExecution(id: number): Promise<ActivityExecutionWithRelations | undefined> {
    const result = await db.query.activityExecutions.findFirst({
      where: eq(activityExecutions.id, id),
      with: {
        serviceActivity: true,
        servicePost: true,
        employee: true,
        attachments: true,
      },
    });
    return result;
  }

  async createActivityExecution(execution: InsertActivityExecution): Promise<ActivityExecution> {
    const [created] = await db.insert(activityExecutions).values(execution).returning();
    return created;
  }

  async updateActivityExecution(id: number, execution: Partial<InsertActivityExecution>): Promise<ActivityExecution | undefined> {
    const [updated] = await db
      .update(activityExecutions)
      .set({ ...execution, updatedAt: new Date() })
      .where(eq(activityExecutions.id, id))
      .returning();
    return updated;
  }

  async deleteActivityExecution(id: number): Promise<boolean> {
    const result = await db.delete(activityExecutions).where(eq(activityExecutions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async bulkUpsertActivityExecutions(executions: InsertActivityExecution[]): Promise<ActivityExecution[]> {
    if (executions.length === 0) return [];
    const results: ActivityExecution[] = [];
    
    for (const execution of executions) {
      const existing = await db.query.activityExecutions.findFirst({
        where: and(
          eq(activityExecutions.serviceActivityId, execution.serviceActivityId),
          eq(activityExecutions.servicePostId, execution.servicePostId),
          eq(activityExecutions.date, execution.date)
        ),
      });
      
      if (existing) {
        const [updated] = await db
          .update(activityExecutions)
          .set({ ...execution, updatedAt: new Date() })
          .where(eq(activityExecutions.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db.insert(activityExecutions).values(execution).returning();
        results.push(created);
      }
    }
    
    return results;
  }

  // Activity Execution Attachments
  async getActivityExecutionAttachments(executionId: number): Promise<ActivityExecutionAttachment[]> {
    return db.select().from(activityExecutionAttachments)
      .where(eq(activityExecutionAttachments.activityExecutionId, executionId))
      .orderBy(desc(activityExecutionAttachments.uploadedAt));
  }

  async getActivityExecutionAttachment(id: number): Promise<ActivityExecutionAttachment | undefined> {
    const [attachment] = await db.select().from(activityExecutionAttachments)
      .where(eq(activityExecutionAttachments.id, id));
    return attachment;
  }

  async createActivityExecutionAttachment(attachment: InsertActivityExecutionAttachment): Promise<ActivityExecutionAttachment> {
    const [created] = await db.insert(activityExecutionAttachments).values(attachment).returning();
    return created;
  }

  async deleteActivityExecutionAttachment(id: number): Promise<boolean> {
    const result = await db.delete(activityExecutionAttachments).where(eq(activityExecutionAttachments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Activity Execution Report
  async getActivityExecutionReport(filters: { startDate: string; endDate: string; servicePostId?: number }): Promise<{
    summary: { totalActivities: number; totalExecutions: number; totalQuantity: number };
    byPost: Array<{
      postId: number;
      postCode: string;
      postName: string;
      activityCount: number;
      executionCount: number;
      totalQuantity: number;
    }>;
    byActivity: Array<{
      activityId: number;
      activityName: string;
      ppuUnit: string;
      executionCount: number;
      totalQuantity: number;
    }>;
  }> {
    const conditions = [
      gte(activityExecutions.date, filters.startDate),
      lte(activityExecutions.date, filters.endDate),
    ];
    if (filters.servicePostId) {
      conditions.push(eq(activityExecutions.servicePostId, filters.servicePostId));
    }

    const executions = await db.query.activityExecutions.findMany({
      where: and(...conditions),
      with: {
        serviceActivity: true,
        servicePost: true,
      },
    });

    const postMap = new Map<number, {
      postId: number;
      postCode: string;
      postName: string;
      activityIds: Set<number>;
      executionCount: number;
      totalQuantity: number;
    }>();

    const activityMap = new Map<number, {
      activityId: number;
      activityName: string;
      ppuUnit: string;
      executionCount: number;
      totalQuantity: number;
    }>();

    let totalExecutions = 0;
    let totalQuantity = 0;
    const allActivityIds = new Set<number>();

    for (const exec of executions) {
      totalExecutions++;
      totalQuantity += exec.quantity;
      allActivityIds.add(exec.serviceActivityId);

      if (exec.servicePost) {
        const postId = exec.servicePost.id;
        if (!postMap.has(postId)) {
          postMap.set(postId, {
            postId,
            postCode: exec.servicePost.postCode,
            postName: exec.servicePost.postName,
            activityIds: new Set(),
            executionCount: 0,
            totalQuantity: 0,
          });
        }
        const post = postMap.get(postId)!;
        post.activityIds.add(exec.serviceActivityId);
        post.executionCount++;
        post.totalQuantity += exec.quantity;
      }

      if (exec.serviceActivity) {
        const activityId = exec.serviceActivity.id;
        if (!activityMap.has(activityId)) {
          activityMap.set(activityId, {
            activityId,
            activityName: exec.serviceActivity.name,
            ppuUnit: exec.serviceActivity.ppuUnit,
            executionCount: 0,
            totalQuantity: 0,
          });
        }
        const activity = activityMap.get(activityId)!;
        activity.executionCount++;
        activity.totalQuantity += exec.quantity;
      }
    }

    return {
      summary: {
        totalActivities: allActivityIds.size,
        totalExecutions,
        totalQuantity,
      },
      byPost: Array.from(postMap.values()).map(p => ({
        postId: p.postId,
        postCode: p.postCode,
        postName: p.postName,
        activityCount: p.activityIds.size,
        executionCount: p.executionCount,
        totalQuantity: p.totalQuantity,
      })),
      byActivity: Array.from(activityMap.values()),
    };
  }
}

export const storage = new DatabaseStorage();
