import { z } from 'zod';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  available: boolean;
}

export interface DepartmentConfig {
  id: string;
  name: string;
  workingHours: {
    start: string;
    end: string;
    lunchStart?: string;
    lunchEnd?: string;
  };
  serviceTimeMinutes: number;
  maxDailyCapacity: number;
  slotsPerBooking: number; // How many slots to show to each user
}

export class SlotManager {
  private static departments: DepartmentConfig[] = [
    {
      id: 'dep-rto',
      name: 'RTO (Transport)',
      workingHours: { start: '08:00', end: '20:00', lunchStart: '13:00', lunchEnd: '14:00' },
      serviceTimeMinutes: 30,
      maxDailyCapacity: 20, // 11 hours * 2 slots per hour (30 min each)
      slotsPerBooking: 3
    },
    {
      id: 'dep-muni',
      name: 'Municipal Corporation',
      workingHours: { start: '08:00', end: '20:00', lunchStart: '13:00', lunchEnd: '14:00' },
      serviceTimeMinutes: 30,
      maxDailyCapacity: 20, // 11 hours * 2 slots per hour (30 min each)
      slotsPerBooking: 3
    },
    {
      id: 'dep-aadhar',
      name: 'Aadhar Center',
      workingHours: { start: '08:00', end: '20:00', lunchStart: '13:00', lunchEnd: '14:00' },
      serviceTimeMinutes: 30,
      maxDailyCapacity: 20, // 11 hours * 2 slots per hour (30 min each)
      slotsPerBooking: 3
    },
    {
      id: 'dep-income',
      name: 'Income Certificate',
      workingHours: { start: '08:00', end: '20:00', lunchStart: '13:00', lunchEnd: '14:00' },
      serviceTimeMinutes: 30,
      maxDailyCapacity: 20, // 11 hours * 2 slots per hour (30 min each)
      slotsPerBooking: 3
    },
    {
      id: 'dep-caste',
      name: 'Caste Certificate',
      workingHours: { start: '08:00', end: '20:00', lunchStart: '13:00', lunchEnd: '14:00' },
      serviceTimeMinutes: 30,
      maxDailyCapacity: 20, // 11 hours * 2 slots per hour (30 min each)
      slotsPerBooking: 3
    },
    {
      id: 'dep-passport',
      name: 'Passport Office',
      workingHours: { start: '08:00', end: '20:00', lunchStart: '13:00', lunchEnd: '14:00' },
      serviceTimeMinutes: 30,
      maxDailyCapacity: 20, // 11 hours * 2 slots per hour (30 min each)
      slotsPerBooking: 3
    },
    {
      id: 'dep-bank',
      name: 'Banking Services',
      workingHours: { start: '08:00', end: '20:00', lunchStart: '13:00', lunchEnd: '14:00' },
      serviceTimeMinutes: 30,
      maxDailyCapacity: 20, // 11 hours * 2 slots per hour (30 min each)
      slotsPerBooking: 3
    },
    {
      id: 'dep-health',
      name: 'Health Department',
      workingHours: { start: '08:00', end: '20:00', lunchStart: '13:00', lunchEnd: '14:00' },
      serviceTimeMinutes: 30,
      maxDailyCapacity: 20, // 11 hours * 2 slots per hour (30 min each)
      slotsPerBooking: 3
    }
  ];

  static getDepartmentConfig(departmentId: string): DepartmentConfig | undefined {
    return this.departments.find(d => d.id === departmentId);
  }

  static generateTimeSlots(departmentId: string, date: string): TimeSlot[] {
    const config = this.getDepartmentConfig(departmentId);
    if (!config) return [];

    const slots: TimeSlot[] = [];
    const { workingHours, serviceTimeMinutes } = config;
    
    // Parse working hours
    const startTime = this.parseTime(workingHours.start);
    const endTime = this.parseTime(workingHours.end);
    const lunchStart = workingHours.lunchStart ? this.parseTime(workingHours.lunchStart) : null;
    const lunchEnd = workingHours.lunchEnd ? this.parseTime(workingHours.lunchEnd) : null;

    let currentTime = startTime;
    let slotId = 1;

    while (currentTime < endTime) {
      const slotEndTime = new Date(currentTime.getTime() + serviceTimeMinutes * 60000);
      
      // Skip lunch break
      if (lunchStart && lunchEnd && 
          currentTime >= lunchStart && currentTime < lunchEnd) {
        currentTime = lunchEnd;
        continue;
      }

      // Don't create slots that would extend beyond working hours
      if (slotEndTime > endTime) break;

      slots.push({
        id: `${departmentId}-${date}-${slotId.toString().padStart(3, '0')}`,
        startTime: this.formatTime(currentTime),
        endTime: this.formatTime(slotEndTime),
        capacity: 1, // Each slot can handle 1 appointment
        booked: 0,
        available: true
      });

      currentTime = slotEndTime;
      slotId++;
    }

    return slots;
  }

  static getAvailableSlots(departmentId: string, date: string, existingBookings: any[]): TimeSlot[] {
    const allSlots = this.generateTimeSlots(departmentId, date);
    const config = this.getDepartmentConfig(departmentId);
    
    if (!config) return [];

    // Count existing bookings per slot
    const bookingsBySlot = new Map<string, number>();
    existingBookings.forEach(booking => {
      if (booking.appointmentDate && new Date(booking.appointmentDate).toDateString() === new Date(date).toDateString()) {
        const slotKey = booking.timeSlot;
        bookingsBySlot.set(slotKey, (bookingsBySlot.get(slotKey) || 0) + 1);
      }
    });

    // Update slot availability
    return allSlots.map(slot => {
      const booked = bookingsBySlot.get(slot.startTime) || 0;
      return {
        ...slot,
        booked,
        available: booked < slot.capacity
      };
    });
  }

  static getSuggestedSlots(departmentId: string, date: string, existingBookings: any[]): TimeSlot[] {
    const availableSlots = this.getAvailableSlots(departmentId, date, existingBookings);
    const config = this.getDepartmentConfig(departmentId);
    
    if (!config) return [];

    // Filter to only available slots
    const openSlots = availableSlots.filter(slot => slot.available);
    
    // Return up to slotsPerBooking suggestions
    return openSlots.slice(0, config.slotsPerBooking);
  }

  static isSlotAvailable(departmentId: string, date: string, timeSlot: string, existingBookings: any[]): boolean {
    const availableSlots = this.getAvailableSlots(departmentId, date, existingBookings);
    const slot = availableSlots.find(s => s.startTime === timeSlot);
    return slot ? slot.available : false;
  }

  static calculateWaitTime(departmentId: string, date: string, existingBookings: any[]): number {
    const availableSlots = this.getAvailableSlots(departmentId, date, existingBookings);
    const config = this.getDepartmentConfig(departmentId);
    
    if (!config) return 0;

    // Count total booked slots
    const totalBooked = availableSlots.reduce((sum, slot) => sum + slot.booked, 0);
    
    // Calculate average wait time based on service time
    return totalBooked * config.serviceTimeMinutes;
  }

  private static parseTime(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private static formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  static getCapacityInfo(departmentId: string, date: string, existingBookings: any[]): {
    totalCapacity: number;
    booked: number;
    available: number;
    percentage: number;
  } {
    const config = this.getDepartmentConfig(departmentId);
    if (!config) return { totalCapacity: 0, booked: 0, available: 0, percentage: 0 };

    const availableSlots = this.getAvailableSlots(departmentId, date, existingBookings);
    const totalCapacity = availableSlots.length;
    const booked = availableSlots.reduce((sum, slot) => sum + slot.booked, 0);
    const available = totalCapacity - booked;
    const percentage = totalCapacity > 0 ? Math.round((booked / totalCapacity) * 100) : 0;

    return { totalCapacity, booked, available, percentage };
  }
}

// Schema for slot booking validation
export const slotBookingSchema = z.object({
  citizenId: z.string().min(1, "Citizen ID is required"),
  departmentId: z.string().min(1),
  serviceId: z.string().min(1),
  appointmentDate: z.string().min(1),
  timeSlot: z.string().min(1),
  priority: z.enum(['normal', 'senior', 'disabled', 'emergency']).default('normal'),
  isPwd: z.boolean().default(false),
  pwdCertificateUrl: z.string().optional().nullable(),
  isSeniorCitizen: z.boolean().default(false),
  ageProofUrl: z.string().optional().nullable(),
  notificationEmail: z.string().email("Please enter a valid email address"),
});

export type SlotBookingData = z.infer<typeof slotBookingSchema>;
