import { z } from 'zod';
import { storage } from './storage';
import { emailService } from './emailService';

export interface WaitlistEntry {
  id: string;
  citizenId: string;
  departmentId: string;
  serviceId: string;
  preferredDate: Date;
  preferredTimeSlot?: string;
  position: number;
  status: 'waiting' | 'assigned' | 'cancelled';
  assignedAppointmentId?: string;
  notificationEmail: string;
  notificationPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitlistAssignment {
  waitlistEntry: WaitlistEntry;
  appointment: any;
  success: boolean;
  message: string;
}

export class WaitlistManager {
  /**
   * Add a citizen to the waitlist for a specific date and service
   */
  static async addToWaitlist(data: {
    citizenId: string;
    departmentId: string;
    serviceId: string;
    preferredDate: Date;
    preferredTimeSlot?: string;
    notificationEmail: string;
    notificationPhone?: string;
  }): Promise<WaitlistEntry> {
    // Check if already on waitlist for this date/service
    const existing = await storage.getWaitlistByCitizenAndDate(
      data.citizenId,
      data.departmentId,
      data.serviceId,
      data.preferredDate
    );

    if (existing) {
      throw new Error('You are already on the waitlist for this date and service');
    }

    // Get next position
    const lastPosition = await storage.getLastWaitlistPosition(
      data.departmentId,
      data.serviceId,
      data.preferredDate
    );

    const waitlistEntry = await storage.createWaitlistEntry({
      ...data,
      position: lastPosition + 1,
      status: 'waiting'
    });

    // Send confirmation email
    await this.sendWaitlistConfirmation(waitlistEntry);

    return waitlistEntry;
  }

  /**
   * Process waitlist when a slot becomes available
   */
  static async processWaitlistForSlot(
    departmentId: string,
    serviceId: string,
    date: Date,
    timeSlot: string
  ): Promise<WaitlistAssignment | null> {
    // Get the first person on waitlist for this date/service
    const waitlistEntry = await storage.getNextWaitlistEntry(
      departmentId,
      serviceId,
      date
    );

    if (!waitlistEntry) {
      return null;
    }

    try {
      // Check if slot is still available
      const existingBookings = await storage.getAppointmentsByDate(date);
      const isSlotAvailable = this.isSlotAvailable(
        departmentId,
        date,
        timeSlot,
        existingBookings
      );

      if (!isSlotAvailable) {
        return {
          waitlistEntry,
          appointment: null,
          success: false,
          message: 'Slot no longer available'
        };
      }

      // Create appointment for waitlisted person
      const appointment = await storage.createAppointment({
        citizenId: waitlistEntry.citizenId,
        departmentId: waitlistEntry.departmentId,
        serviceId: waitlistEntry.serviceId,
        appointmentDate: date,
        timeSlot: timeSlot,
        notificationEmail: waitlistEntry.notificationEmail,
        notificationPhone: waitlistEntry.notificationPhone,
        isWaitlisted: false, // Now confirmed
        autoReassignedFrom: null
      });

      // Update waitlist entry
      await storage.updateWaitlistEntry(waitlistEntry.id, {
        status: 'assigned',
        assignedAppointmentId: appointment.id
      });

      // Send notification
      await this.sendWaitlistAssignmentNotification(waitlistEntry, appointment);

      return {
        waitlistEntry,
        appointment,
        success: true,
        message: 'Successfully assigned from waitlist'
      };

    } catch (error) {
      console.error('Error processing waitlist:', error);
      return {
        waitlistEntry,
        appointment: null,
        success: false,
        message: 'Error processing waitlist assignment'
      };
    }
  }

  /**
   * Remove from waitlist (cancellation)
   */
  static async removeFromWaitlist(
    waitlistId: string,
    reason: string = 'User cancelled'
  ): Promise<void> {
    const waitlistEntry = await storage.getWaitlistEntry(waitlistId);
    if (!waitlistEntry) {
      throw new Error('Waitlist entry not found');
    }

    await storage.updateWaitlistEntry(waitlistId, {
      status: 'cancelled'
    });

    // Reorder remaining entries
    await this.reorderWaitlistPositions(
      waitlistEntry.departmentId,
      waitlistEntry.serviceId,
      waitlistEntry.preferredDate
    );
  }

  /**
   * Reorder waitlist positions after removal
   */
  private static async reorderWaitlistPositions(
    departmentId: string,
    serviceId: string,
    date: Date
  ): Promise<void> {
    const waitlistEntries = await storage.getWaitlistByDateAndService(
      departmentId,
      serviceId,
      date
    );

    // Sort by original creation time and update positions
    const sortedEntries = waitlistEntries
      .filter(entry => entry.status === 'waiting')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (let i = 0; i < sortedEntries.length; i++) {
      await storage.updateWaitlistEntry(sortedEntries[i].id, {
        position: i + 1
      });
    }
  }

  /**
   * Check if slot is available
   */
  private static isSlotAvailable(
    departmentId: string,
    date: Date,
    timeSlot: string,
    existingBookings: any[]
  ): boolean {
    // Get department config
    const department = this.getDepartmentConfig(departmentId);
    if (!department) return false;

    // Count existing bookings for this slot
    const slotBookings = existingBookings.filter(booking => 
      booking.departmentId === departmentId &&
      booking.timeSlot === timeSlot &&
      new Date(booking.appointmentDate).toDateString() === date.toDateString()
    );

    return slotBookings.length < department.maxSlotsPerTimeSlot;
  }

  /**
   * Get department configuration
   */
  private static getDepartmentConfig(departmentId: string) {
    // This would typically come from database
    return {
      maxSlotsPerTimeSlot: 1, // Default
      workingHours: { start: '08:00', end: '20:00' },
      serviceTimeMinutes: 30
    };
  }

  /**
   * Send waitlist confirmation email
   */
  private static async sendWaitlistConfirmation(waitlistEntry: WaitlistEntry): Promise<void> {
    const user = await storage.getUser(waitlistEntry.citizenId);
    const department = await storage.getDepartment(waitlistEntry.departmentId);
    const service = await storage.getService(waitlistEntry.serviceId);

    const template = emailService.generateWaitlistConfirmation(
      user,
      waitlistEntry,
      department,
      service
    );

    await emailService.sendEmail(
      waitlistEntry.notificationEmail,
      template.subject,
      template.html,
      template.text
    );
  }

  /**
   * Send waitlist assignment notification
   */
  private static async sendWaitlistAssignmentNotification(
    waitlistEntry: WaitlistEntry,
    appointment: any
  ): Promise<void> {
    const user = await storage.getUser(waitlistEntry.citizenId);
    const department = await storage.getDepartment(waitlistEntry.departmentId);
    const service = await storage.getService(waitlistEntry.serviceId);

    const template = emailService.generateWaitlistAssignment(
      user,
      appointment,
      department,
      service
    );

    await emailService.sendEmail(
      waitlistEntry.notificationEmail,
      template.subject,
      template.html,
      template.text
    );
  }

  /**
   * Get waitlist status for a citizen
   */
  static async getWaitlistStatus(citizenId: string): Promise<WaitlistEntry[]> {
    return await storage.getWaitlistByCitizen(citizenId);
  }

  /**
   * Get waitlist for admin view
   */
  static async getWaitlistForAdmin(
    departmentId: string,
    serviceId: string,
    date: Date
  ): Promise<WaitlistEntry[]> {
    return await storage.getWaitlistByDateAndService(departmentId, serviceId, date);
  }
}

// Validation schemas
export const waitlistSchema = z.object({
  citizenId: z.string().min(1),
  departmentId: z.string().min(1),
  serviceId: z.string().min(1),
  preferredDate: z.string().min(1),
  preferredTimeSlot: z.string().optional(),
  notificationEmail: z.string().email(),
  notificationPhone: z.string().optional(),
});

export type WaitlistData = z.infer<typeof waitlistSchema>;
