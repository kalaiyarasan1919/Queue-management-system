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
import { MongoClient, ObjectId } from "mongodb";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;

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
  getCounterByClerk(clerkId: string): Promise<Counter | undefined>;
  createCounter(counter: InsertCounter): Promise<Counter>;
  updateCounter(id: string, counter: Partial<InsertCounter>): Promise<Counter>;
  updateCounterStatus(id: string, status: string): Promise<Counter>;

  // Appointment operations
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByUser(userId: string): Promise<Appointment[]>;
  getAppointmentsByDepartment(departmentId: string): Promise<Appointment[]>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAppointmentByToken(tokenNumber: string): Promise<Appointment | undefined>;
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
  private mongoClient?: MongoClient;
  private get useMongo() { return !!process.env.MONGO_URL; }
  // In-memory fallback when Postgres is not configured (development convenience)
  private static inMemory = {
    departments: [
      { id: "dep-rto", name: "RTO (Transport)", nameHi: "आरटीओ", nameTa: "ஆர்டிஓ", icon: "car", isActive: true, workingHours: { start: "08:00", end: "20:00" }, createdAt: new Date(), updatedAt: new Date() },
      { id: "dep-muni", name: "Municipal Corporation", nameHi: "नगर निगम", nameTa: "மாநகராட்சி", icon: "building", isActive: true, workingHours: { start: "08:00", end: "20:00" }, createdAt: new Date(), updatedAt: new Date() },
      { id: "dep-aadhar", name: "Aadhar Center", nameHi: "आधार केंद्र", nameTa: "ஆதார் மையம்", icon: "id", isActive: true, workingHours: { start: "08:00", end: "20:00" }, createdAt: new Date(), updatedAt: new Date() },
      { id: "dep-income", name: "Income Certificate", nameHi: "आय प्रमाण पत्र", nameTa: "வருமான சான்றிதழ்", icon: "file-text", isActive: true, workingHours: { start: "08:00", end: "20:00" }, createdAt: new Date(), updatedAt: new Date() },
      { id: "dep-caste", name: "Caste Certificate", nameHi: "जाति प्रमाण पत्र", nameTa: "சாதி சான்றிதழ்", icon: "shield", isActive: true, workingHours: { start: "08:00", end: "20:00" }, createdAt: new Date(), updatedAt: new Date() },
      { id: "dep-passport", name: "Passport Office", nameHi: "पासपोर्ट कार्यालय", nameTa: "கடவுச்சீட்டு அலுவலகம்", icon: "book", isActive: true, workingHours: { start: "08:00", end: "20:00" }, createdAt: new Date(), updatedAt: new Date() },
      { id: "dep-bank", name: "Banking Services", nameHi: "बैंकिंग सेवाएं", nameTa: "வங்கி சேவைகள்", icon: "credit-card", isActive: true, workingHours: { start: "08:00", end: "20:00" }, createdAt: new Date(), updatedAt: new Date() },
      { id: "dep-health", name: "Health Department", nameHi: "स्वास्थ्य विभाग", nameTa: "சுகாதார துறை", icon: "heart", isActive: true, workingHours: { start: "08:00", end: "20:00" }, createdAt: new Date(), updatedAt: new Date() },
    ] as any[],
    services: [
      // RTO Services
      { id: "srv-dl", departmentId: "dep-rto", name: "Driving License Renewal", nameHi: "ड्राइविंग लाइसेंस नवीकरण", nameTa: "ஓட்டுநர் உரிமம் புதுப்பித்தல்", description: "Renew your driving license", estimatedTime: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-rc", departmentId: "dep-rto", name: "RC Transfer", nameHi: "आरसी स्थानांतरण", nameTa: "ஆர்.சி மாற்றம்", description: "Transfer vehicle registration", estimatedTime: 20, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-ll", departmentId: "dep-rto", name: "Learning License", nameHi: "लर्निंग लाइसेंस", nameTa: "கற்றல் உரிமம்", description: "Apply for learning license", estimatedTime: 10, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-vehicle", departmentId: "dep-rto", name: "Vehicle Registration", nameHi: "वाहन पंजीकरण", nameTa: "வாகன பதிவு", description: "Register new vehicle", estimatedTime: 25, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      
      // Municipal Services
      { id: "srv-birth", departmentId: "dep-muni", name: "Birth Certificate", nameHi: "जन्म प्रमाण पत्र", nameTa: "பிறப்பு சான்றிதழ்", description: "Apply for birth certificate", estimatedTime: 10, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-death", departmentId: "dep-muni", name: "Death Certificate", nameHi: "मृत्यु प्रमाण पत्र", nameTa: "மரண சான்றிதழ்", description: "Apply for death certificate", estimatedTime: 10, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-marriage", departmentId: "dep-muni", name: "Marriage Certificate", nameHi: "विवाह प्रमाण पत्र", nameTa: "திருமண சான்றிதழ்", description: "Apply for marriage certificate", estimatedTime: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-property", departmentId: "dep-muni", name: "Property Tax", nameHi: "संपत्ति कर", nameTa: "சொத்து வரி", description: "Pay property tax", estimatedTime: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      
      // Aadhar Services
      { id: "srv-addr", departmentId: "dep-aadhar", name: "Address Update", nameHi: "पता अपडेट", nameTa: "முகவரி புதுப்பித்தல்", description: "Update Aadhar address", estimatedTime: 10, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-mobile", departmentId: "dep-aadhar", name: "Mobile Update", nameHi: "मोबाइल अपडेट", nameTa: "மொபைல் புதுப்பித்தல்", description: "Update mobile number", estimatedTime: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-new", departmentId: "dep-aadhar", name: "New Aadhar", nameHi: "नया आधार", nameTa: "புதிய ஆதார்", description: "Apply for new Aadhar", estimatedTime: 20, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      
      // Income Certificate Services
      { id: "srv-income-new", departmentId: "dep-income", name: "New Income Certificate", nameHi: "नया आय प्रमाण पत्र", nameTa: "புதிய வருமான சான்றிதழ்", description: "Apply for income certificate", estimatedTime: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-income-renew", departmentId: "dep-income", name: "Income Certificate Renewal", nameHi: "आय प्रमाण पत्र नवीकरण", nameTa: "வருமான சான்றிதழ் புதுப்பித்தல்", description: "Renew income certificate", estimatedTime: 10, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      
      // Caste Certificate Services
      { id: "srv-caste-new", departmentId: "dep-caste", name: "New Caste Certificate", nameHi: "नया जाति प्रमाण पत्र", nameTa: "புதிய சாதி சான்றிதழ்", description: "Apply for caste certificate", estimatedTime: 20, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-caste-renew", departmentId: "dep-caste", name: "Caste Certificate Renewal", nameHi: "जाति प्रमाण पत्र नवीकरण", nameTa: "சாதி சான்றிதழ் புதுப்பித்தல்", description: "Renew caste certificate", estimatedTime: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      
      // Passport Services
      { id: "srv-passport-new", departmentId: "dep-passport", name: "New Passport", nameHi: "नया पासपोर्ट", nameTa: "புதிய கடவுச்சீட்டு", description: "Apply for new passport", estimatedTime: 30, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-passport-renew", departmentId: "dep-passport", name: "Passport Renewal", nameHi: "पासपोर्ट नवीकरण", nameTa: "கடவுச்சீட்டு புதுப்பித்தல்", description: "Renew passport", estimatedTime: 20, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      
      // Banking Services
      { id: "srv-account", departmentId: "dep-bank", name: "Open Bank Account", nameHi: "बैंक खाता खोलें", nameTa: "வங்கி கணக்கு திறக்க", description: "Open new bank account", estimatedTime: 25, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-loan", departmentId: "dep-bank", name: "Loan Application", nameHi: "ऋण आवेदन", nameTa: "கடன் விண்ணப்பம்", description: "Apply for loan", estimatedTime: 30, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      
      // Health Services
      { id: "srv-medical", departmentId: "dep-health", name: "Medical Certificate", nameHi: "चिकित्सा प्रमाण पत्र", nameTa: "மருத்துவ சான்றிதழ்", description: "Apply for medical certificate", estimatedTime: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "srv-health-card", departmentId: "dep-health", name: "Health Card", nameHi: "स्वास्थ्य कार्ड", nameTa: "சுகாதார அட்டை", description: "Apply for health card", estimatedTime: 10, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ] as any[],
    appointments: [] as any[],
    counters: [] as any[],
    users: [] as any[],
    announcements: [] as any[],
  };
  private async getMongo() {
    if (!this.useMongo) return undefined;
    if (!this.mongoClient) {
      this.mongoClient = new MongoClient(process.env.MONGO_URL!);
      await this.mongoClient.connect();
    }
    return this.mongoClient.db(process.env.MONGO_DB || "smartqueue");
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    if (this.useMongo) {
      const dbm = await this.getMongo();
      const doc = await dbm!.collection("users").findOne({ id });
      return doc as unknown as User | undefined;
    }
    if (!db) {
      return DatabaseStorage.inMemory.users.find((u) => u.id === id) as any;
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    if (this.useMongo) {
      const dbm = await this.getMongo();
      const result = await dbm!.collection("users").findOneAndUpdate(
        { id: userId },
        { $set: { role, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      return result as unknown as User;
    }
    if (!db) {
      const idx = DatabaseStorage.inMemory.users.findIndex((u) => u.id === userId);
      if (idx === -1) throw new Error('User not found');
      const updated: any = { ...DatabaseStorage.inMemory.users[idx], role, updatedAt: new Date() };
      DatabaseStorage.inMemory.users[idx] = updated;
      return updated as User;
    }
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (this.useMongo) {
      const dbm = await this.getMongo();
      const doc = await dbm!.collection("users").findOne({ email });
      return doc as unknown as User | undefined;
    }
    if (!db) {
      return DatabaseStorage.inMemory.users.find((u) => u.email === email) as any;
    }
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (this.useMongo) {
      const dbm = await this.getMongo();
      const filter = userData.providerId ? { providerId: userData.providerId } : { email: userData.email };
      
      // Remove id from userData to avoid MongoDB conflict
      const { id, ...userDataWithoutId } = userData;
      const userForSet = {
        ...userDataWithoutId,
        role: userDataWithoutId.role || "citizen",
      } as typeof userDataWithoutId;
      
      const userId = id || new ObjectId().toString();
      const update = { 
        $set: { ...userForSet, updatedAt: new Date() }, 
        $setOnInsert: { 
          _id: new ObjectId(),
          id: userId, 
          qrCode: `equeue://user/${userId}`,
          createdAt: new Date() 
        } 
      };
      const result = await dbm!.collection("users").findOneAndUpdate(filter, update, { upsert: true, returnDocument: "after" });
      return result as unknown as User;
    }
    if (!db) {
      const byProvider = userData.providerId ? DatabaseStorage.inMemory.users.find((u) => u.providerId === userData.providerId) : undefined;
      const byEmail = !byProvider && userData.email ? DatabaseStorage.inMemory.users.find((u) => u.email === userData.email) : undefined;
      const existing = byProvider || byEmail;
      const now = new Date();
      if (existing) {
        const merged: any = { ...existing, ...userData, role: (userData as any).role || existing.role || 'citizen', updatedAt: now };
        const idx = DatabaseStorage.inMemory.users.findIndex((u) => u.id === existing.id);
        DatabaseStorage.inMemory.users[idx] = merged;
        return merged as User;
      }
      const userId = (userData as any).id || `usr_${Math.random().toString(36).slice(2)}`;
      const newUser: any = {
        id: userId,
        email: (userData as any).email || null,
        firstName: (userData as any).firstName || null,
        lastName: (userData as any).lastName || null,
        profileImageUrl: (userData as any).profileImageUrl || null,
        password: (userData as any).password || null,
        authProvider: (userData as any).authProvider || 'local',
        providerId: (userData as any).providerId || null,
        role: (userData as any).role || 'citizen',
        isEmailVerified: (userData as any).isEmailVerified ?? false,
        qrCode: `equeue://user/${userId}`,
        createdAt: now,
        updatedAt: now,
      };
      DatabaseStorage.inMemory.users.push(newUser);
      return newUser as User;
    }
    // For OAuth users, use providerId as the primary key
    const conflictTarget = userData.providerId ? users.providerId : users.email;
    const userId = userData.id || `usr_${Math.random().toString(36).slice(2)}`;
    const userWithQR = {
      ...userData,
      qrCode: `equeue://user/${userId}`,
    };
    const [user] = await db
      .insert(users)
      .values(userWithQR)
      .onConflictDoUpdate({
        target: conflictTarget,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    if (!db) {
      return DatabaseStorage.inMemory.users.filter((u) => (u.role || 'citizen') === role) as any;
    }
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Department operations
  async getDepartments(): Promise<Department[]> {
    if (!db) {
      return DatabaseStorage.inMemory.departments.filter((d) => d.isActive);
    }
    return await db.select().from(departments).where(eq(departments.isActive, true)).orderBy(asc(departments.name));
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    if (!db) {
      return DatabaseStorage.inMemory.departments.find((d) => d.id === id) as any;
    }
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    if (!db) {
      const now = new Date();
      const newDept: any = { id: `dep_${Math.random().toString(36).slice(2)}`, ...department, isActive: true, createdAt: now, updatedAt: now };
      DatabaseStorage.inMemory.departments.push(newDept);
      return newDept as Department;
    }
    const [newDepartment] = await db.insert(departments).values(department).returning();
    return newDepartment;
  }

  async updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department> {
    if (!db) {
      const idx = DatabaseStorage.inMemory.departments.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error('Department not found');
      const updated = { ...DatabaseStorage.inMemory.departments[idx], ...department, updatedAt: new Date() };
      DatabaseStorage.inMemory.departments[idx] = updated;
      return updated as any;
    }
    const [updatedDepartment] = await db
      .update(departments)
      .set({ ...department, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return updatedDepartment;
  }

  // Service operations
  async getServicesByDepartment(departmentId: string): Promise<Service[]> {
    if (!db) {
      return DatabaseStorage.inMemory.services.filter((s) => s.departmentId === departmentId && s.isActive);
    }
    return await db
      .select()
      .from(services)
      .where(and(eq(services.departmentId, departmentId), eq(services.isActive, true)))
      .orderBy(asc(services.name));
  }

  async getService(id: string): Promise<Service | undefined> {
    if (!db) {
      return DatabaseStorage.inMemory.services.find((s) => s.id === id) as any;
    }
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    if (!db) {
      const now = new Date();
      const newService: any = { id: `srv_${Math.random().toString(36).slice(2)}`, ...service, isActive: true, createdAt: now, updatedAt: now };
      DatabaseStorage.inMemory.services.push(newService);
      return newService as Service;
    }
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service> {
    if (!db) {
      const idx = DatabaseStorage.inMemory.services.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error('Service not found');
      const updated = { ...DatabaseStorage.inMemory.services[idx], ...service, updatedAt: new Date() };
      DatabaseStorage.inMemory.services[idx] = updated;
      return updated as any;
    }
    const [updatedService] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  // Counter operations
  async getCountersByDepartment(departmentId: string): Promise<Counter[]> {
    if (!db) {
      return DatabaseStorage.inMemory.counters
        .filter((c) => c.departmentId === departmentId)
        .sort((a, b) => a.number - b.number) as any;
    }
    return await db
      .select()
      .from(counters)
      .where(eq(counters.departmentId, departmentId))
      .orderBy(asc(counters.number));
  }

  async getCounter(id: string): Promise<Counter | undefined> {
    if (!db) {
      return DatabaseStorage.inMemory.counters.find((c) => c.id === id) as any;
    }
    const [counter] = await db.select().from(counters).where(eq(counters.id, id));
    return counter;
  }

  async getCounterByClerk(clerkId: string): Promise<Counter | undefined> {
    if (!db) {
      return DatabaseStorage.inMemory.counters.find((c) => c.clerkId === clerkId) as any;
    }
    const [counter] = await db.select().from(counters).where(eq(counters.clerkId, clerkId));
    return counter;
  }

  async createCounter(counter: InsertCounter): Promise<Counter> {
    if (!db) {
      const newCounter: any = {
        id: `ctr_${Math.random().toString(36).slice(2)}`,
        departmentId: counter.departmentId as any,
        number: counter.number as any,
        clerkId: (counter as any).clerkId || null,
        status: 'offline',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      DatabaseStorage.inMemory.counters.push(newCounter);
      return newCounter as Counter;
    }
    const [newCounter] = await db.insert(counters).values(counter).returning();
    return newCounter;
  }

  async updateCounter(id: string, counter: Partial<InsertCounter>): Promise<Counter> {
    if (!db) {
      const idx = DatabaseStorage.inMemory.counters.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Counter not found');
      const updated = { ...DatabaseStorage.inMemory.counters[idx], ...counter, updatedAt: new Date() };
      DatabaseStorage.inMemory.counters[idx] = updated;
      return updated as any;
    }
    const [updatedCounter] = await db
      .update(counters)
      .set({ ...counter, updatedAt: new Date() })
      .where(eq(counters.id, id))
      .returning();
    return updatedCounter;
  }

  async updateCounterStatus(id: string, status: string): Promise<Counter> {
    if (!db) {
      const idx = DatabaseStorage.inMemory.counters.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Counter not found');
      const updated = { ...DatabaseStorage.inMemory.counters[idx], status, updatedAt: new Date() };
      DatabaseStorage.inMemory.counters[idx] = updated;
      return updated as any;
    }
    const [updatedCounter] = await db
      .update(counters)
      .set({ status, updatedAt: new Date() })
      .where(eq(counters.id, id))
      .returning();
    return updatedCounter;
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    if (!db) {
      // newest first
      return [...DatabaseStorage.inMemory.appointments].sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
    }
    return await db
      .select()
      .from(appointments)
      .orderBy(desc(appointments.createdAt));
  }

  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    if (!db) {
      return DatabaseStorage.inMemory.appointments
        .filter((a) => a.citizenId === userId)
        .sort((a, b) => (b.appointmentDate as any) - (a.appointmentDate as any));
    }
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
    if (!db) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      return DatabaseStorage.inMemory.appointments.filter((a) => a.appointmentDate >= startDate && a.appointmentDate < endDate);
    }
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
    if (!db) {
      return DatabaseStorage.inMemory.appointments.find((a) => a.id === id) as any;
    }
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentByToken(tokenNumber: string): Promise<Appointment | undefined> {
    if (!db) {
      const appt = DatabaseStorage.inMemory.appointments.find((a) => a.tokenNumber === tokenNumber);
      return appt as any;
    }
    const [appointment] = await db
      .select({
        // Appointment fields
        id: appointments.id,
        tokenNumber: appointments.tokenNumber,
        citizenId: appointments.citizenId,
        departmentId: appointments.departmentId,
        serviceId: appointments.serviceId,
        counterId: appointments.counterId,
        appointmentDate: appointments.appointmentDate,
        timeSlot: appointments.timeSlot,
        priority: appointments.priority,
        isPwd: appointments.isPwd,
        pwdCertificateUrl: appointments.pwdCertificateUrl,
        isSeniorCitizen: appointments.isSeniorCitizen,
        ageProofUrl: appointments.ageProofUrl,
        notificationEmail: appointments.notificationEmail,
        status: appointments.status,
        queuePosition: appointments.queuePosition,
        estimatedWaitTime: appointments.estimatedWaitTime,
        actualStartTime: appointments.actualStartTime,
        actualEndTime: appointments.actualEndTime,
        qrCode: appointments.qrCode,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        // User fields
        citizen: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          qrCode: users.qrCode,
        },
        // Department fields
        department: {
          id: departments.id,
          name: departments.name,
          nameHi: departments.nameHi,
          nameTa: departments.nameTa,
          icon: departments.icon,
          workingHours: departments.workingHours,
        },
        // Service fields
        service: {
          id: services.id,
          name: services.name,
          nameHi: services.nameHi,
          nameTa: services.nameTa,
          description: services.description,
          estimatedTime: services.estimatedTime,
        },
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.citizenId, users.id))
      .leftJoin(departments, eq(appointments.departmentId, departments.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.tokenNumber, tokenNumber))
      .limit(1);
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    if (!db) {
      // enforce 1 booking per user per day (in-memory)
      const dayStr = new Date(appointment.appointmentDate as any).toDateString();
      const existing = DatabaseStorage.inMemory.appointments.find(
        (a) => a.citizenId === (appointment as any).citizenId && new Date(a.appointmentDate).toDateString() === dayStr
      );
      if (existing) {
        throw new Error('You already have a booking for this day');
      }
      // In-memory creation with PwD priority
      const sameDay = DatabaseStorage.inMemory.appointments.filter(
        (a) => a.departmentId === (appointment as any).departmentId && new Date(a.appointmentDate).toDateString() === new Date(appointment.appointmentDate).toDateString()
      );
      const departmentCode = (appointment as any).departmentId.substring(0, 1).toUpperCase();
      const tokenNumber = `${departmentCode}${(sameDay.length + 1).toString().padStart(2, '0')}`;

      // Priority reordering: PwD > Senior Citizen > Normal
      let queuePosition = sameDay.length + 1;
      const isPwd = (appointment as any).isPwd;
      const isSenior = (appointment as any).isSeniorCitizen;
      
      if (isPwd) {
        const pwdAhead = sameDay.filter((a) => a.isPwd).length;
        queuePosition = pwdAhead + 1;
        // Shift back non-PwD appointments at or after this position
        DatabaseStorage.inMemory.appointments = DatabaseStorage.inMemory.appointments.map((a) => {
          if (
            a.departmentId === (appointment as any).departmentId &&
            new Date(a.appointmentDate).toDateString() === new Date(appointment.appointmentDate).toDateString() &&
            !a.isPwd &&
            a.queuePosition >= queuePosition
          ) {
            return { ...a, queuePosition: a.queuePosition + 1, updatedAt: new Date() };
          }
          return a;
        });
      } else if (isSenior) {
        const pwdAhead = sameDay.filter((a) => a.isPwd).length;
        const seniorAhead = sameDay.filter((a) => a.isSeniorCitizen && !a.isPwd).length;
        queuePosition = pwdAhead + seniorAhead + 1;
        // Shift back normal appointments at or after this position
        DatabaseStorage.inMemory.appointments = DatabaseStorage.inMemory.appointments.map((a) => {
          if (
            a.departmentId === (appointment as any).departmentId &&
            new Date(a.appointmentDate).toDateString() === new Date(appointment.appointmentDate).toDateString() &&
            !a.isPwd && !a.isSeniorCitizen &&
            a.queuePosition >= queuePosition
          ) {
            return { ...a, queuePosition: a.queuePosition + 1, updatedAt: new Date() };
          }
          return a;
        });
      }

      const newAppt: any = {
        id: `appt_${Math.random().toString(36).slice(2)}`,
        tokenNumber,
        citizenId: (appointment as any).citizenId,
        departmentId: (appointment as any).departmentId,
        serviceId: (appointment as any).serviceId,
        appointmentDate: new Date(appointment.appointmentDate as any),
        timeSlot: (appointment as any).timeSlot,
        priority: (appointment as any).priority || 'normal',
        status: 'confirmed',
        queuePosition,
        estimatedWaitTime: 0,
        actualStartTime: null,
        actualEndTime: null,
        qrCode: `equeue://${tokenNumber}/${appointment.appointmentDate}`,
        notes: null,
        isPwd: (appointment as any).isPwd ?? false,
        pwdCertificateUrl: (appointment as any).pwdCertificateUrl ?? null,
        isSeniorCitizen: (appointment as any).isSeniorCitizen ?? false,
        ageProofUrl: (appointment as any).ageProofUrl ?? null,
        notificationEmail: (appointment as any).notificationEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      DatabaseStorage.inMemory.appointments.push(newAppt);
      return newAppt as Appointment;
    }
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
    
    // Calculate queue position with priority: PwD > Senior Citizen > Normal
    let queuePosition = tokenCount[0].count + 1;
    const isPwd = (appointment as any).isPwd;
    const isSenior = (appointment as any).isSeniorCitizen;
    
    if (isPwd) {
      const [{ count: pwdAhead }] = await db
        .select({ count: count() })
        .from(appointments)
        .where(
          and(
            eq(appointments.departmentId, appointment.departmentId),
            sql`DATE(${appointments.appointmentDate}) = DATE(${appointment.appointmentDate})`,
            sql`${appointments.isPwd} = true`
          )
        );
      queuePosition = Number(pwdAhead) + 1;
      // Shift non-PwD appointments back by 1
      await db
        .update(appointments)
        .set({ 
          queuePosition: sql`${appointments.queuePosition} + 1`,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(appointments.departmentId, appointment.departmentId),
            sql`DATE(${appointments.appointmentDate}) = DATE(${appointment.appointmentDate})`,
            sql`${appointments.isPwd} = false`,
            sql`${appointments.queuePosition} >= ${queuePosition}`
          )
        );
    } else if (isSenior) {
      const [{ count: pwdAhead }] = await db
        .select({ count: count() })
        .from(appointments)
        .where(
          and(
            eq(appointments.departmentId, appointment.departmentId),
            sql`DATE(${appointments.appointmentDate}) = DATE(${appointment.appointmentDate})`,
            sql`${appointments.isPwd} = true`
          )
        );
      const [{ count: seniorAhead }] = await db
        .select({ count: count() })
        .from(appointments)
        .where(
          and(
            eq(appointments.departmentId, appointment.departmentId),
            sql`DATE(${appointments.appointmentDate}) = DATE(${appointment.appointmentDate})`,
            sql`${appointments.isSeniorCitizen} = true`,
            sql`${appointments.isPwd} = false`
          )
        );
      queuePosition = Number(pwdAhead) + Number(seniorAhead) + 1;
      // Shift normal appointments back by 1
      await db
        .update(appointments)
        .set({ 
          queuePosition: sql`${appointments.queuePosition} + 1`,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(appointments.departmentId, appointment.departmentId),
            sql`DATE(${appointments.appointmentDate}) = DATE(${appointment.appointmentDate})`,
            sql`${appointments.isPwd} = false`,
            sql`${appointments.isSeniorCitizen} = false`,
            sql`${appointments.queuePosition} >= ${queuePosition}`
          )
        );
    }
    
    // Generate QR code data (would use QR code library in real implementation)
    const qrCode = `equeue://${tokenNumber}/${appointment.appointmentDate}`;
    
    // enforce 1 booking per user per day (db)
    const existing = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.citizenId, appointment.citizenId),
          sql`DATE(${appointments.appointmentDate}) = DATE(${appointment.appointmentDate})`
        )
      );
    if (existing.length > 0) {
      throw new Error('You already have a booking for this day');
    }
    
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        ...appointment,
        tokenNumber,
        queuePosition,
        qrCode,
        isPwd: (appointment as any).isPwd ?? false,
        pwdCertificateUrl: (appointment as any).pwdCertificateUrl ?? null,
        isSeniorCitizen: (appointment as any).isSeniorCitizen ?? false,
        ageProofUrl: (appointment as any).ageProofUrl ?? null,
        notificationEmail: (appointment as any).notificationEmail,
      })
      .returning();
    
    return newAppointment;
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    if (!db) {
      const idx = DatabaseStorage.inMemory.appointments.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error('Appointment not found');
      const updated = { ...DatabaseStorage.inMemory.appointments[idx], ...appointment, updatedAt: new Date() };
      DatabaseStorage.inMemory.appointments[idx] = updated;
      return updated as any;
    }
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...appointment, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: string): Promise<void> {
    if (!db) {
      DatabaseStorage.inMemory.appointments = DatabaseStorage.inMemory.appointments.filter((a) => a.id !== id);
      return;
    }
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getAppointmentsByUser(userId: string): Promise<Appointment[]> {
    console.log('getAppointmentsByUser called with userId:', userId);
    if (!db) {
      console.log('Using in-memory storage. Total appointments:', DatabaseStorage.inMemory.appointments.length);
      const userAppointments = DatabaseStorage.inMemory.appointments
        .filter((a) => a.citizenId === userId)
        .sort((a, b) => (b.appointmentDate as any) - (a.appointmentDate as any)) as any;
      console.log('Found appointments for user:', userAppointments.length);
      console.log('All appointments citizenIds:', DatabaseStorage.inMemory.appointments.map(a => a.citizenId));
      return userAppointments;
    }
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.citizenId, userId))
      .orderBy(desc(appointments.appointmentDate));
  }

  // Queue operations
  async getQueueByDepartment(departmentId: string, date?: string): Promise<Appointment[]> {
    const today = date ? new Date(date) : new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (!db) {
      return DatabaseStorage.inMemory.appointments
        .filter((a) => a.departmentId === departmentId && a.appointmentDate >= today && a.appointmentDate < tomorrow && ['confirmed','waiting','serving'].includes(a.status))
        .sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0)) as any;
    }
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
    if (!db) {
      const next = DatabaseStorage.inMemory.appointments
        .filter((a) => a.departmentId === departmentId && a.status === 'waiting')
        .sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0))[0];
      return next as any;
    }
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
    
    if (!db) {
      waitingAppointments.forEach((appt, idx) => {
        const i = DatabaseStorage.inMemory.appointments.findIndex((a) => a.id === (appt as any).id);
        if (i !== -1) {
          DatabaseStorage.inMemory.appointments[i] = { ...DatabaseStorage.inMemory.appointments[i], queuePosition: idx + 1, updatedAt: new Date() };
        }
      });
      return;
    }
    for (let i = 0; i < waitingAppointments.length; i++) {
      await db
        .update(appointments)
        .set({ 
        queuePosition: i + 1,
          updatedAt: new Date()
        })
        .where(eq(appointments.id, waitingAppointments[i].id));
    }
  }

  // Analytics operations
  async getDepartmentStats(departmentId: string, date: string): Promise<any> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    if (!db) {
      const items = DatabaseStorage.inMemory.appointments.filter((a) => a.departmentId === departmentId && a.appointmentDate >= startDate && a.appointmentDate < endDate);
      const stats = {
        totalAppointments: items.length,
        completed: items.filter((a) => a.status === 'completed').length,
        cancelled: items.filter((a) => a.status === 'cancelled').length,
        noShow: items.filter((a) => a.status === 'no_show').length,
      } as any;
      return stats;
    }
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

    if (!db) {
      const appts = DatabaseStorage.inMemory.appointments.filter((a) => a.appointmentDate >= startDate && a.appointmentDate < endDate);
      const stats = {
        totalAppointments: appts.length,
        completed: appts.filter((a) => a.status === 'completed').length,
        activeCounters: DatabaseStorage.inMemory.counters.filter((c) => c.status === 'active').length,
        totalCounters: DatabaseStorage.inMemory.counters.length,
      } as any;
      return stats;
    }
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
    if (!db) {
      return DatabaseStorage.inMemory.announcements
        .filter((a) => a.isActive)
        .sort((a, b) => (b.createdAt as any) - (a.createdAt as any));
    }
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.isActive, true))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    if (!db) {
      const now = new Date();
      const newAnn: any = { id: `ann_${Math.random().toString(36).slice(2)}`, ...announcement, isActive: true, createdAt: now, updatedAt: now };
      DatabaseStorage.inMemory.announcements.push(newAnn);
      return newAnn as Announcement;
    }
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement> {
    if (!db) {
      const idx = DatabaseStorage.inMemory.announcements.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error('Announcement not found');
      const updated = { ...DatabaseStorage.inMemory.announcements[idx], ...announcement, updatedAt: new Date() };
      DatabaseStorage.inMemory.announcements[idx] = updated;
      return updated as any;
    }
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set({ ...announcement, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement;
  }
}

export const storage = new DatabaseStorage();
