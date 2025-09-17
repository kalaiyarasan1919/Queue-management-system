import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("citizen"), // citizen, clerk, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Departments
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  nameHi: varchar("name_hi"), // Hindi translation
  nameTa: varchar("name_ta"), // Tamil translation
  icon: varchar("icon").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  workingHours: jsonb("working_hours").notNull(), // {start: "09:00", end: "17:00"}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services offered by departments
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").notNull().references(() => departments.id),
  name: varchar("name").notNull(),
  nameHi: varchar("name_hi"),
  nameTa: varchar("name_ta"),
  description: text("description"),
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Counters in each department
export const counters = pgTable("counters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  departmentId: varchar("department_id").notNull().references(() => departments.id),
  number: integer("number").notNull(),
  clerkId: varchar("clerk_id").references(() => users.id),
  status: varchar("status").notNull().default("offline"), // active, busy, break, offline
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Priority types
export const priorityEnum = pgEnum("priority", ["normal", "senior", "disabled", "emergency"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["confirmed", "waiting", "serving", "completed", "cancelled", "no_show"]);

// Appointments/Tokens
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenNumber: varchar("token_number").notNull().unique(),
  citizenId: varchar("citizen_id").notNull().references(() => users.id),
  departmentId: varchar("department_id").notNull().references(() => departments.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  counterId: varchar("counter_id").references(() => counters.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  timeSlot: varchar("time_slot").notNull(), // "09:00-10:00"
  priority: priorityEnum("priority").notNull().default("normal"),
  status: appointmentStatusEnum("status").notNull().default("confirmed"),
  queuePosition: integer("queue_position"),
  estimatedWaitTime: integer("estimated_wait_time"), // in minutes
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  qrCode: text("qr_code"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System announcements
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  titleHi: varchar("title_hi"),
  titleTa: varchar("title_ta"),
  message: text("message").notNull(),
  messageHi: text("message_hi"),
  messageTa: text("message_ta"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  counters: many(counters),
  announcements: many(announcements),
}));

export const departmentRelations = relations(departments, ({ many }) => ({
  services: many(services),
  counters: many(counters),
  appointments: many(appointments),
}));

export const serviceRelations = relations(services, ({ one, many }) => ({
  department: one(departments, {
    fields: [services.departmentId],
    references: [departments.id],
  }),
  appointments: many(appointments),
}));

export const counterRelations = relations(counters, ({ one, many }) => ({
  department: one(departments, {
    fields: [counters.departmentId],
    references: [departments.id],
  }),
  clerk: one(users, {
    fields: [counters.clerkId],
    references: [users.id],
  }),
  appointments: many(appointments),
}));

export const appointmentRelations = relations(appointments, ({ one }) => ({
  citizen: one(users, {
    fields: [appointments.citizenId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [appointments.departmentId],
    references: [departments.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  counter: one(counters, {
    fields: [appointments.counterId],
    references: [counters.id],
  }),
}));

export const announcementRelations = relations(announcements, ({ one }) => ({
  createdBy: one(users, {
    fields: [announcements.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCounterSchema = createInsertSchema(counters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  tokenNumber: true,
  queuePosition: true,
  estimatedWaitTime: true,
  qrCode: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Counter = typeof counters.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertCounter = z.infer<typeof insertCounterSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
