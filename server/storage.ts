import {
  users,
  departments,
  services,
  counters,
  appointments,
  announcements,
  type User,
  type UpsertUser,
  type Department,
  type Service,
  type Counter,
  type Appointment,
  type Announcement,
  type InsertDepartment,
  type InsertService,
  type InsertCounter,
  type InsertAppointment,
  type InsertAnnouncement,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;

  // Department operations
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department>;

  // Service operations
  getServicesByDepartment(departmentId: string): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;

  // Counter operations
  getCountersByDepartment(departmentId: string): Promise<Counter[]>;
  getCounter(id: string): Promise<Counter | undefined>;
  createCounter(counter: InsertCounter): Promise<Counter>;
  updateCounter(id: string, counter: Partial<InsertCounter>): Promise<Counter>;
  updateCounterStatus(id: string, status: string): Promise<Counter>;

  // Appointment operations
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByUser(userId: string): Promise<Appointment[]>;
  getAppointmentsByDepartment(departmentId: string): Promise<Appointment[]>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;

  // Queue operations
  getQueueByDepartment(departmentId: string, date?: string): Promise<Appointment[]>;
  getNextInQueue(departmentId: string, counterId: string): Promise<Appointment | undefined>;
  updateQueuePositions(departmentId: string, date: string): Promise<void>;

  // Analytics operations
  getDepartmentStats(departmentId: string, date: string): Promise<any>;
  getSystemStats(date: string): Promise<any>;

  // Announcement operations
  getActiveAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement>;
}

export class DatabaseStorage implements IStorage {
  // User operations
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

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.isActive, true)).orderBy(asc(departments.name));
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department> {
    const [updatedDepartment] = await db
      .update(departments)
      .set({ ...department, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return updatedDepartment;
  }

  // Service operations
  async getServicesByDepartment(departmentId: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(and(eq(services.departmentId, departmentId), eq(services.isActive, true)))
      .orderBy(asc(services.name));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  // Counter operations
  async getCountersByDepartment(departmentId: string): Promise<Counter[]> {
    return await db
      .select()
      .from(counters)
      .where(eq(counters.departmentId, departmentId))
      .orderBy(asc(counters.number));
  }

  async getCounter(id: string): Promise<Counter | undefined> {
    const [counter] = await db.select().from(counters).where(eq(counters.id, id));
    return counter;
  }

  async createCounter(counter: InsertCounter): Promise<Counter> {
    const [newCounter] = await db.insert(counters).values(counter).returning();
    return newCounter;
  }

  async updateCounter(id: string, counter: Partial<InsertCounter>): Promise<Counter> {
    const [updatedCounter] = await db
      .update(counters)
      .set({ ...counter, updatedAt: new Date() })
      .where(eq(counters.id, id))
      .returning();
    return updatedCounter;
  }

  async updateCounterStatus(id: string, status: string): Promise<Counter> {
    const [updatedCounter] = await db
      .update(counters)
      .set({ status, updatedAt: new Date() })
      .where(eq(counters.id, id))
      .returning();
    return updatedCounter;
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .orderBy(desc(appointments.createdAt));
  }

  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.citizenId, userId))
      .orderBy(desc(appointments.appointmentDate));
  }

  async getAppointmentsByDepartment(departmentId: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.departmentId, departmentId))
      .orderBy(asc(appointments.queuePosition));
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    return await db
      .select()
      .from(appointments)
      .where(
        and(
          sql`${appointments.appointmentDate} >= ${startDate}`,
          sql`${appointments.appointmentDate} < ${endDate}`
        )
      )
      .orderBy(asc(appointments.queuePosition));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    // Generate token number
    const departmentCode = appointment.departmentId.substring(0, 1).toUpperCase();
    const tokenCount = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.departmentId, appointment.departmentId),
          sql`DATE(${appointments.appointmentDate}) = DATE(${appointment.appointmentDate})`
        )
      );
    
    const tokenNumber = `${departmentCode}${(tokenCount[0].count + 1).toString().padStart(2, '0')}`;
    
    // Calculate queue position
    const queuePosition = tokenCount[0].count + 1;
    
    // Generate QR code data (would use QR code library in real implementation)
    const qrCode = `equeue://${tokenNumber}/${appointment.appointmentDate}`;
    
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        ...appointment,
        tokenNumber,
        queuePosition,
        qrCode,
      })
      .returning();
    
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  // Queue operations
  async getQueueByDepartment(departmentId: string, date?: string): Promise<Appointment[]> {
    const today = date ? new Date(date) : new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.departmentId, departmentId),
          sql`${appointments.appointmentDate} >= ${today}`,
          sql`${appointments.appointmentDate} < ${tomorrow}`,
          sql`${appointments.status} IN ('confirmed', 'waiting', 'serving')`
        )
      )
      .orderBy(asc(appointments.queuePosition));
  }

  async getNextInQueue(departmentId: string, counterId: string): Promise<Appointment | undefined> {
    const [nextAppointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.departmentId, departmentId),
          eq(appointments.status, 'waiting')
        )
      )
      .orderBy(asc(appointments.queuePosition))
      .limit(1);
    
    return nextAppointment;
  }

  async updateQueuePositions(departmentId: string, date: string): Promise<void> {
    // Recalculate queue positions for remaining appointments
    const waitingAppointments = await this.getQueueByDepartment(departmentId, date);
    
    for (let i = 0; i < waitingAppointments.length; i++) {
      await this.updateAppointment(waitingAppointments[i].id, {
        queuePosition: i + 1,
      });
    }
  }

  // Analytics operations
  async getDepartmentStats(departmentId: string, date: string): Promise<any> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const [stats] = await db
      .select({
        totalAppointments: count(),
        completed: sql`SUM(CASE WHEN ${appointments.status} = 'completed' THEN 1 ELSE 0 END)`,
        cancelled: sql`SUM(CASE WHEN ${appointments.status} = 'cancelled' THEN 1 ELSE 0 END)`,
        noShow: sql`SUM(CASE WHEN ${appointments.status} = 'no_show' THEN 1 ELSE 0 END)`,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.departmentId, departmentId),
          sql`${appointments.appointmentDate} >= ${startDate}`,
          sql`${appointments.appointmentDate} < ${endDate}`
        )
      );

    return stats;
  }

  async getSystemStats(date: string): Promise<any> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const [stats] = await db
      .select({
        totalAppointments: count(),
        completed: sql`SUM(CASE WHEN ${appointments.status} = 'completed' THEN 1 ELSE 0 END)`,
        activeCounters: sql`(SELECT COUNT(*) FROM ${counters} WHERE ${counters.status} = 'active')`,
        totalCounters: sql`(SELECT COUNT(*) FROM ${counters})`,
      })
      .from(appointments)
      .where(
        and(
          sql`${appointments.appointmentDate} >= ${startDate}`,
          sql`${appointments.appointmentDate} < ${endDate}`
        )
      );

    return stats;
  }

  // Announcement operations
  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.isActive, true))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement> {
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set({ ...announcement, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement;
  }
}

export const storage = new DatabaseStorage();
