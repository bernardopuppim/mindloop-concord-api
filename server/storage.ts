import {
  users,
  employees,
  servicePosts,
  allocations,
  occurrences,
  documents,
  auditLogs,
  notificationSettings,
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
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

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

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
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
}

export const storage = new DatabaseStorage();
