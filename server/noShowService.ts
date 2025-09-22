import { storage } from './storage';
import { notificationService } from './notificationService';
import { waitlistManager } from './waitlistManager';
import { auditService } from './auditService';

export interface NoShowConfig {
  gracePeriodMinutes: number; // Grace period before marking as no-show
  autoMarkNoShow: boolean; // Whether to automatically mark as no-show
  notifyBeforeNoShow: boolean; // Whether to notify before marking as no-show
  notificationMinutesBefore: number; // Minutes before no-show to notify
  allowReactivation: boolean; // Whether to allow reactivation after no-show
  reactivationWindowHours: number; // Hours after no-show to allow reactivation
}

export interface NoShowRecord {
  appointmentId: string;
  tokenNumber: string;
  citizenId: string;
  departmentId: string;
  serviceId: string;
  appointmentDate: Date;
  timeSlot: string;
  markedAt: Date;
  markedBy?: string; // user ID who marked as no-show
  reason?: string;
  gracePeriodUsed: number; // Minutes of grace period used
  canReactivate: boolean;
  reactivationDeadline?: Date;
}

export class NoShowService {
  private static config: NoShowConfig = {
    gracePeriodMinutes: 15,
    autoMarkNoShow: true,
    notifyBeforeNoShow: true,
    notificationMinutesBefore: 5,
    allowReactivation: true,
    reactivationWindowHours: 2
  };

  /**
   * Check for no-shows and process them
   */
  static async processNoShows(): Promise<{
    processed: number;
    noShows: NoShowRecord[];
    waitlistAssignments: any[];
  }> {
    const now = new Date();
    const noShows: NoShowRecord[] = [];
    const waitlistAssignments: any[] = [];

    // Get appointments that should be checked for no-show
    const appointmentsToCheck = await this.getAppointmentsToCheck(now);

    for (const appointment of appointmentsToCheck) {
      const noShowRecord = await this.checkAndMarkNoShow(appointment, now);
      if (noShowRecord) {
        noShows.push(noShowRecord);

        // Try to assign from waitlist
        if (this.shouldProcessWaitlist(appointment)) {
          try {
            const waitlistAssignment = await waitlistManager.processWaitlistForSlot(
              appointment.departmentId,
              appointment.serviceId,
              new Date(appointment.appointmentDate),
              appointment.timeSlot
            );
            if (waitlistAssignment) {
              waitlistAssignments.push(waitlistAssignment);
            }
          } catch (error) {
            console.error('Error processing waitlist after no-show:', error);
          }
        }
      }
    }

    return {
      processed: appointmentsToCheck.length,
      noShows,
      waitlistAssignments
    };
  }

  /**
   * Manually mark appointment as no-show
   */
  static async markAsNoShow(
    appointmentId: string,
    markedBy: string,
    reason?: string
  ): Promise<NoShowRecord | null> {
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check if already marked as no-show
    if (appointment.status === 'no_show') {
      throw new Error('Appointment is already marked as no-show');
    }

    // Check if appointment can be marked as no-show
    if (!this.canMarkAsNoShow(appointment)) {
      throw new Error('Appointment cannot be marked as no-show');
    }

    // Mark as no-show
    await storage.updateAppointment(appointmentId, {
      status: 'no_show',
      noShowAt: new Date().toISOString()
    });

    // Create no-show record
    const noShowRecord: NoShowRecord = {
      appointmentId: appointment.id,
      tokenNumber: appointment.tokenNumber,
      citizenId: appointment.citizenId,
      departmentId: appointment.departmentId,
      serviceId: appointment.serviceId,
      appointmentDate: new Date(appointment.appointmentDate),
      timeSlot: appointment.timeSlot,
      markedAt: new Date(),
      markedBy,
      reason,
      gracePeriodUsed: this.calculateGracePeriodUsed(appointment),
      canReactivate: this.config.allowReactivation,
      reactivationDeadline: this.config.allowReactivation ? 
        new Date(Date.now() + this.config.reactivationWindowHours * 60 * 60 * 1000) : undefined
    };

    // Log no-show
    await auditService.logNoShow(appointment, markedBy, reason);

    // Send no-show notification
    await this.sendNoShowNotification(appointment, noShowRecord);

    return noShowRecord;
  }

  /**
   * Reactivate appointment after no-show
   */
  static async reactivateAppointment(
    appointmentId: string,
    reactivatedBy: string,
    reason: string
  ): Promise<boolean> {
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check if appointment is marked as no-show
    if (appointment.status !== 'no_show') {
      throw new Error('Appointment is not marked as no-show');
    }

    // Check if reactivation is allowed
    if (!this.config.allowReactivation) {
      throw new Error('Reactivation is not allowed');
    }

    // Check if within reactivation window
    if (appointment.noShowAt) {
      const noShowTime = new Date(appointment.noShowAt);
      const reactivationDeadline = new Date(
        noShowTime.getTime() + this.config.reactivationWindowHours * 60 * 60 * 1000
      );

      if (new Date() > reactivationDeadline) {
        throw new Error('Reactivation window has expired');
      }
    }

    // Check if slot is still available
    const isSlotAvailable = await this.isSlotAvailable(
      appointment.departmentId,
      appointment.serviceId,
      new Date(appointment.appointmentDate),
      appointment.timeSlot
    );

    if (!isSlotAvailable) {
      throw new Error('The original time slot is no longer available');
    }

    // Reactivate appointment
    await storage.updateAppointment(appointmentId, {
      status: 'confirmed',
      noShowAt: null
    });

    // Log reactivation
    await auditService.logAppointmentUpdated(
      appointmentId,
      { status: 'no_show' },
      { status: 'confirmed' },
      reactivatedBy,
      `Reactivated after no-show: ${reason}`
    );

    // Send reactivation notification
    await this.sendReactivationNotification(appointment, reason);

    return true;
  }

  /**
   * Get appointments that should be checked for no-show
   */
  private static async getAppointmentsToCheck(now: Date): Promise<any[]> {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await storage.getAppointmentsByDateRange(startOfDay, endOfDay);
    
    return appointments.filter(appointment => {
      // Only check confirmed or waiting appointments
      if (!['confirmed', 'waiting'].includes(appointment.status)) {
        return false;
      }

      // Check if appointment time has passed
      const appointmentTime = this.getAppointmentTime(appointment);
      const timeSinceAppointment = (now.getTime() - appointmentTime.getTime()) / (1000 * 60); // minutes

      // Check if grace period has passed
      return timeSinceAppointment >= this.config.gracePeriodMinutes;
    });
  }

  /**
   * Check and mark appointment as no-show if applicable
   */
  private static async checkAndMarkNoShow(
    appointment: any,
    now: Date
  ): Promise<NoShowRecord | null> {
    if (!this.config.autoMarkNoShow) {
      return null;
    }

    // Check if already marked as no-show
    if (appointment.status === 'no_show') {
      return null;
    }

    // Mark as no-show
    await storage.updateAppointment(appointment.id, {
      status: 'no_show',
      noShowAt: now.toISOString()
    });

    // Create no-show record
    const noShowRecord: NoShowRecord = {
      appointmentId: appointment.id,
      tokenNumber: appointment.tokenNumber,
      citizenId: appointment.citizenId,
      departmentId: appointment.departmentId,
      serviceId: appointment.serviceId,
      appointmentDate: new Date(appointment.appointmentDate),
      timeSlot: appointment.timeSlot,
      markedAt: now,
      gracePeriodUsed: this.calculateGracePeriodUsed(appointment),
      canReactivate: this.config.allowReactivation,
      reactivationDeadline: this.config.allowReactivation ? 
        new Date(now.getTime() + this.config.reactivationWindowHours * 60 * 60 * 1000) : undefined
    };

    // Log no-show
    await auditService.logNoShow(appointment, 'system', 'Auto-marked as no-show');

    // Send no-show notification
    await this.sendNoShowNotification(appointment, noShowRecord);

    return noShowRecord;
  }

  /**
   * Check if appointment can be marked as no-show
   */
  private static canMarkAsNoShow(appointment: any): boolean {
    // Only confirmed or waiting appointments can be marked as no-show
    return ['confirmed', 'waiting'].includes(appointment.status);
  }

  /**
   * Check if waitlist should be processed
   */
  private static shouldProcessWaitlist(appointment: any): boolean {
    // Process waitlist if appointment was confirmed
    return appointment.status === 'confirmed';
  }

  /**
   * Check if slot is available
   */
  private static async isSlotAvailable(
    departmentId: string,
    serviceId: string,
    date: Date,
    timeSlot: string
  ): Promise<boolean> {
    const appointments = await storage.getAppointmentsByDate(date);
    
    const slotAppointments = appointments.filter(apt => 
      apt.departmentId === departmentId &&
      apt.serviceId === serviceId &&
      apt.timeSlot === timeSlot &&
      ['confirmed', 'waiting', 'serving'].includes(apt.status)
    );

    const department = await storage.getDepartment(departmentId);
    const maxSlotsPerTimeSlot = department?.maxSlotsPerTimeSlot || 1;

    return slotAppointments.length < maxSlotsPerTimeSlot;
  }

  /**
   * Get appointment time
   */
  private static getAppointmentTime(appointment: any): Date {
    const appointmentDate = new Date(appointment.appointmentDate);
    const [startTime] = appointment.timeSlot.split('-');
    const [hours, minutes] = startTime.split(':').map(Number);
    
    appointmentDate.setHours(hours, minutes, 0, 0);
    return appointmentDate;
  }

  /**
   * Calculate grace period used
   */
  private static calculateGracePeriodUsed(appointment: any): number {
    const appointmentTime = this.getAppointmentTime(appointment);
    const now = new Date();
    const timeSinceAppointment = (now.getTime() - appointmentTime.getTime()) / (1000 * 60); // minutes
    
    return Math.min(timeSinceAppointment, this.config.gracePeriodMinutes);
  }

  /**
   * Send no-show notification
   */
  private static async sendNoShowNotification(
    appointment: any,
    noShowRecord: NoShowRecord
  ): Promise<void> {
    const user = await storage.getUser(appointment.citizenId);
    const department = await storage.getDepartment(appointment.departmentId);
    const service = await storage.getService(appointment.serviceId);

    await notificationService.sendNotification({
      to: appointment.notificationEmail,
      channel: appointment.preferredChannel || 'email',
      template: 'appointment_no_show',
      variables: {
        firstName: user.firstName,
        tokenNumber: appointment.tokenNumber,
        appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString(),
        timeSlot: appointment.timeSlot,
        departmentName: department.name,
        serviceName: service.name,
        canReactivate: noShowRecord.canReactivate,
        reactivationDeadline: noShowRecord.reactivationDeadline?.toLocaleString()
      }
    });
  }

  /**
   * Send reactivation notification
   */
  private static async sendReactivationNotification(
    appointment: any,
    reason: string
  ): Promise<void> {
    const user = await storage.getUser(appointment.citizenId);
    const department = await storage.getDepartment(appointment.departmentId);
    const service = await storage.getService(appointment.serviceId);

    await notificationService.sendNotification({
      to: appointment.notificationEmail,
      channel: appointment.preferredChannel || 'email',
      template: 'appointment_reactivated',
      variables: {
        firstName: user.firstName,
        tokenNumber: appointment.tokenNumber,
        appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString(),
        timeSlot: appointment.timeSlot,
        departmentName: department.name,
        serviceName: service.name,
        reactivationReason: reason
      }
    });
  }

  /**
   * Get no-show statistics
   */
  static async getNoShowStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalNoShows: number;
    noShowsByDepartment: Record<string, number>;
    noShowsByService: Record<string, number>;
    noShowsByTimeSlot: Record<string, number>;
    reactivationRate: number;
    averageGracePeriodUsed: number;
  }> {
    const appointments = await storage.getAppointmentsByDateRange(startDate, endDate);
    const noShowAppointments = appointments.filter(a => a.status === 'no_show');
    
    const totalNoShows = noShowAppointments.length;

    // Group by department
    const noShowsByDepartment: Record<string, number> = {};
    for (const apt of noShowAppointments) {
      const department = await storage.getDepartment(apt.departmentId);
      const deptName = department?.name || 'Unknown';
      noShowsByDepartment[deptName] = (noShowsByDepartment[deptName] || 0) + 1;
    }

    // Group by service
    const noShowsByService: Record<string, number> = {};
    for (const apt of noShowAppointments) {
      const service = await storage.getService(apt.serviceId);
      const serviceName = service?.name || 'Unknown';
      noShowsByService[serviceName] = (noShowsByService[serviceName] || 0) + 1;
    }

    // Group by time slot
    const noShowsByTimeSlot: Record<string, number> = {};
    noShowAppointments.forEach(apt => {
      noShowsByTimeSlot[apt.timeSlot] = (noShowsByTimeSlot[apt.timeSlot] || 0) + 1;
    });

    // Calculate reactivation rate (simplified)
    const reactivationRate = 0; // Would need to track reactivations

    // Calculate average grace period used
    const averageGracePeriodUsed = this.config.gracePeriodMinutes; // Simplified

    return {
      totalNoShows,
      noShowsByDepartment,
      noShowsByService,
      noShowsByTimeSlot,
      reactivationRate,
      averageGracePeriodUsed
    };
  }

  /**
   * Update no-show configuration
   */
  static updateConfig(newConfig: Partial<NoShowConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  static getConfig(): NoShowConfig {
    return { ...this.config };
  }
}

export const noShowService = new NoShowService();
