import {
  users,
  employees,
  servicePosts,
  allocations,
  occurrences,
  documents,
  auditLogs,
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

  getOccurrences(filters?: { startDate?: string; endDate?: string; category?: string; employeeId?: number }): Promise<OccurrenceWithRelations[]>;
  getOccurrence(id: number): Promise<OccurrenceWithRelations | undefined>;
  createOccurrence(occurrence: InsertOccurrence): Promise<Occurrence>;
  updateOccurrence(id: number, occurrence: Partial<InsertOccurrence>): Promise<Occurrence | undefined>;
  deleteOccurrence(id: number): Promise<boolean>;

  getDocuments(filters?: { documentType?: string; employeeId?: number; postId?: number; monthYear?: string }): Promise<DocumentWithRelations[]>;
  getDocument(id: number): Promise<DocumentWithRelations | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;

  getAuditLogs(limit?: number): Promise<AuditLogWithRelations[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  getDashboardStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    totalServicePosts: number;
    totalDocuments: number;
    recentOccurrences: number;
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
}

export const storage = new DatabaseStorage();
