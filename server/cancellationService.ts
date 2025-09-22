import { z } from 'zod';
import { storage } from './storage';
import { notificationService } from './notificationService';
import { waitlistManager } from './waitlistManager';
import { auditService } from './auditService';

export interface CancellationData {
  appointmentId: string;
  reason: string;
  cancelledBy: string; // user ID
  refundEligible: boolean;
  refundAmount?: number;
  cancellationFee?: number;
}

export interface ReschedulingData {
  appointmentId: string;
  newDate: Date;
  newTimeSlot: string;
  reason?: string;
  rescheduledBy: string; // user ID
}

export interface CancellationPolicy {
  id: string;
  name: string;
  cutoffHours: number; // Hours before appointment when cancellation is allowed
  refundPercentage: number; // Percentage of refund (0-100)
  cancellationFee: number; // Fixed fee for cancellation
  isActive: boolean;
}

export class CancellationService {
  private static cancellationPolicies: CancellationPolicy[] = [
    {
      id: 'standard',
      name: 'Standard Policy',
      cutoffHours: 24,
      refundPercentage: 100,
      cancellationFee: 0,
      isActive: true
    },
    {
      id: 'premium',
      name: 'Premium Policy',
      cutoffHours: 48,
      refundPercentage: 100,
      cancellationFee: 0,
      isActive: true
    },
    {
      id: 'emergency',
      name: 'Emergency Policy',
      cutoffHours: 2,
      refundPercentage: 50,
      cancellationFee: 10,
      isActive: true
    }
  ];

  /**
   * Cancel an appointment
   */
  static async cancelAppointment(data: CancellationData): Promise<{
    success: boolean;
    message: string;
    refundAmount?: number;
    waitlistAssignment?: any;
  }> {
    // Get appointment details
    const appointment = await storage.getAppointment(data.appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check if appointment can be cancelled
    const canCancel = await this.canCancelAppointment(appointment, data.cancelledBy);
    if (!canCancel.allowed) {
      return {
        success: false,
        message: canCancel.reason
      };
    }

    // Get cancellation policy
    const policy = this.getCancellationPolicy(appointment);
    const refundAmount = this.calculateRefund(appointment, policy);

    // Update appointment status
    await storage.updateAppointment(data.appointmentId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: data.cancelledBy,
      cancellationReason: data.reason
    });

    // Log cancellation
    await auditService.logAppointmentCancelled(
      appointment,
      data.cancelledBy,
      data.reason
    );

    // Send cancellation notification
    await this.sendCancellationNotification(appointment, data.reason, refundAmount);

    // Try to assign from waitlist
    let waitlistAssignment = null;
    if (this.shouldProcessWaitlist(appointment)) {
      try {
        waitlistAssignment = await waitlistManager.processWaitlistForSlot(
          appointment.departmentId,
          appointment.serviceId,
          new Date(appointment.appointmentDate),
          appointment.timeSlot
        );
      } catch (error) {
        console.error('Error processing waitlist after cancellation:', error);
      }
    }

    return {
      success: true,
      message: 'Appointment cancelled successfully',
      refundAmount,
      waitlistAssignment
    };
  }

  /**
   * Reschedule an appointment
   */
  static async rescheduleAppointment(data: ReschedulingData): Promise<{
    success: boolean;
    message: string;
    newAppointment?: any;
  }> {
    // Get original appointment
    const originalAppointment = await storage.getAppointment(data.appointmentId);
    if (!originalAppointment) {
      throw new Error('Appointment not found');
    }

    // Check if appointment can be rescheduled
    const canReschedule = await this.canRescheduleAppointment(originalAppointment, data.rescheduledBy);
    if (!canReschedule.allowed) {
      return {
        success: false,
        message: canReschedule.reason
      };
    }

    // Check if new slot is available
    const isSlotAvailable = await this.isSlotAvailable(
      originalAppointment.departmentId,
      originalAppointment.serviceId,
      data.newDate,
      data.newTimeSlot
    );

    if (!isSlotAvailable) {
      return {
        success: false,
        message: 'The selected time slot is no longer available'
      };
    }

    // Create new appointment
    const newAppointment = await storage.createAppointment({
      citizenId: originalAppointment.citizenId,
      departmentId: originalAppointment.departmentId,
      serviceId: originalAppointment.serviceId,
      appointmentDate: data.newDate,
      timeSlot: data.newTimeSlot,
      notificationEmail: originalAppointment.notificationEmail,
      notificationPhone: originalAppointment.notificationPhone,
      preferredChannel: originalAppointment.preferredChannel,
      priority: originalAppointment.priority,
      isPwd: originalAppointment.isPwd,
      isSeniorCitizen: originalAppointment.isSeniorCitizen,
      isVip: originalAppointment.isVip,
      isEmergency: originalAppointment.isEmergency,
      rescheduledFrom: originalAppointment.id,
      rescheduledAt: new Date().toISOString()
    });

    // Cancel original appointment
    await storage.updateAppointment(data.appointmentId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: data.rescheduledBy,
      cancellationReason: `Rescheduled to ${data.newDate.toLocaleDateString()} ${data.newTimeSlot}`
    });

    // Log rescheduling
    await auditService.logAppointmentRescheduled(
      originalAppointment,
      newAppointment,
      data.rescheduledBy,
      data.reason
    );

    // Send rescheduling notification
    await this.sendReschedulingNotification(originalAppointment, newAppointment);

    return {
      success: true,
      message: 'Appointment rescheduled successfully',
      newAppointment
    };
  }

  /**
   * Check if appointment can be cancelled
   */
  private static async canCancelAppointment(
    appointment: any,
    cancelledBy: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check if appointment is already cancelled
    if (appointment.status === 'cancelled') {
      return { allowed: false, reason: 'Appointment is already cancelled' };
    }

    // Check if appointment is completed
    if (appointment.status === 'completed') {
      return { allowed: false, reason: 'Cannot cancel completed appointment' };
    }

    // Check if appointment is currently being served
    if (appointment.status === 'serving') {
      return { allowed: false, reason: 'Cannot cancel appointment that is currently being served' };
    }

    // Check cancellation policy
    const policy = this.getCancellationPolicy(appointment);
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < policy.cutoffHours) {
      return { 
        allowed: false, 
        reason: `Cancellation not allowed within ${policy.cutoffHours} hours of appointment` 
      };
    }

    return { allowed: true };
  }

  /**
   * Check if appointment can be rescheduled
   */
  private static async canRescheduleAppointment(
    appointment: any,
    rescheduledBy: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check if appointment is already cancelled
    if (appointment.status === 'cancelled') {
      return { allowed: false, reason: 'Cannot reschedule cancelled appointment' };
    }

    // Check if appointment is completed
    if (appointment.status === 'completed') {
      return { allowed: false, reason: 'Cannot reschedule completed appointment' };
    }

    // Check if appointment is currently being served
    if (appointment.status === 'serving') {
      return { allowed: false, reason: 'Cannot reschedule appointment that is currently being served' };
    }

    // Check rescheduling policy (same as cancellation for now)
    const policy = this.getCancellationPolicy(appointment);
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < policy.cutoffHours) {
      return { 
        allowed: false, 
        reason: `Rescheduling not allowed within ${policy.cutoffHours} hours of appointment` 
      };
    }

    return { allowed: true };
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
    
    // Count existing appointments for this slot
    const slotAppointments = appointments.filter(apt => 
      apt.departmentId === departmentId &&
      apt.serviceId === serviceId &&
      apt.timeSlot === timeSlot &&
      ['confirmed', 'waiting', 'serving'].includes(apt.status)
    );

    // Get department capacity (simplified)
    const department = await storage.getDepartment(departmentId);
    const maxSlotsPerTimeSlot = department?.maxSlotsPerTimeSlot || 1;

    return slotAppointments.length < maxSlotsPerTimeSlot;
  }

  /**
   * Get cancellation policy for appointment
   */
  private static getCancellationPolicy(appointment: any): CancellationPolicy {
    // Determine policy based on appointment type
    if (appointment.isEmergency) {
      return this.cancellationPolicies.find(p => p.id === 'emergency') || this.cancellationPolicies[0];
    } else if (appointment.isVip) {
      return this.cancellationPolicies.find(p => p.id === 'premium') || this.cancellationPolicies[0];
    } else {
      return this.cancellationPolicies.find(p => p.id === 'standard') || this.cancellationPolicies[0];
    }
  }

  /**
   * Calculate refund amount
   */
  private static calculateRefund(appointment: any, policy: CancellationPolicy): number {
    // For now, assume all appointments are free
    // In a real system, you'd have pricing information
    const appointmentFee = 0; // This would come from appointment data
    
    if (policy.refundPercentage === 0) {
      return 0;
    }

    const refundAmount = (appointmentFee * policy.refundPercentage) / 100;
    return Math.max(0, refundAmount - policy.cancellationFee);
  }

  /**
   * Check if waitlist should be processed
   */
  private static shouldProcessWaitlist(appointment: any): boolean {
    // Process waitlist if appointment was confirmed and not a no-show
    return appointment.status === 'confirmed' || appointment.status === 'waiting';
  }

  /**
   * Send cancellation notification
   */
  private static async sendCancellationNotification(
    appointment: any,
    reason: string,
    refundAmount?: number
  ): Promise<void> {
    const user = await storage.getUser(appointment.citizenId);
    const department = await storage.getDepartment(appointment.departmentId);
    const service = await storage.getService(appointment.serviceId);

    await notificationService.sendNotification({
      to: appointment.notificationEmail,
      channel: appointment.preferredChannel || 'email',
      template: 'appointment_cancellation',
      variables: {
        firstName: user.firstName,
        tokenNumber: appointment.tokenNumber,
        cancellationReason: reason,
        refundAmount: refundAmount || 0,
        departmentName: department.name,
        serviceName: service.name
      }
    });
  }

  /**
   * Send rescheduling notification
   */
  private static async sendReschedulingNotification(
    originalAppointment: any,
    newAppointment: any
  ): Promise<void> {
    const user = await storage.getUser(originalAppointment.citizenId);
    const department = await storage.getDepartment(originalAppointment.departmentId);
    const service = await storage.getService(originalAppointment.serviceId);

    await notificationService.sendNotification({
      to: originalAppointment.notificationEmail,
      channel: originalAppointment.preferredChannel || 'email',
      template: 'appointment_rescheduled',
      variables: {
        firstName: user.firstName,
        oldTokenNumber: originalAppointment.tokenNumber,
        newTokenNumber: newAppointment.tokenNumber,
        oldDate: new Date(originalAppointment.appointmentDate).toLocaleDateString(),
        newDate: new Date(newAppointment.appointmentDate).toLocaleDateString(),
        oldTimeSlot: originalAppointment.timeSlot,
        newTimeSlot: newAppointment.timeSlot,
        departmentName: department.name,
        serviceName: service.name
      }
    });
  }

  /**
   * Get cancellation policies
   */
  static getCancellationPolicies(): CancellationPolicy[] {
    return this.cancellationPolicies.filter(policy => policy.isActive);
  }

  /**
   * Update cancellation policy
   */
  static updateCancellationPolicy(
    policyId: string,
    updates: Partial<CancellationPolicy>
  ): boolean {
    const policyIndex = this.cancellationPolicies.findIndex(p => p.id === policyId);
    if (policyIndex === -1) {
      return false;
    }

    this.cancellationPolicies[policyIndex] = {
      ...this.cancellationPolicies[policyIndex],
      ...updates
    };

    return true;
  }

  /**
   * Get cancellation statistics
   */
  static async getCancellationStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalCancellations: number;
    cancellationsByReason: Record<string, number>;
    cancellationsByDepartment: Record<string, number>;
    averageRefundAmount: number;
    cancellationRate: number;
  }> {
    const appointments = await storage.getAppointmentsByDateRange(startDate, endDate);
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');
    
    const totalAppointments = appointments.length;
    const totalCancellations = cancelledAppointments.length;
    
    // Calculate cancellation rate
    const cancellationRate = totalAppointments > 0 ? 
      (totalCancellations / totalAppointments) * 100 : 0;

    // Group by reason
    const cancellationsByReason: Record<string, number> = {};
    cancelledAppointments.forEach(apt => {
      const reason = apt.cancellationReason || 'No reason provided';
      cancellationsByReason[reason] = (cancellationsByReason[reason] || 0) + 1;
    });

    // Group by department
    const cancellationsByDepartment: Record<string, number> = {};
    for (const apt of cancelledAppointments) {
      const department = await storage.getDepartment(apt.departmentId);
      const deptName = department?.name || 'Unknown';
      cancellationsByDepartment[deptName] = (cancellationsByDepartment[deptName] || 0) + 1;
    }

    // Calculate average refund (simplified)
    const averageRefundAmount = 0; // Would need to track actual refunds

    return {
      totalCancellations,
      cancellationsByReason,
      cancellationsByDepartment,
      averageRefundAmount,
      cancellationRate: Math.round(cancellationRate * 100) / 100
    };
  }
}

// Validation schemas
export const cancellationSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().min(1),
  cancelledBy: z.string().min(1)
});

export const reschedulingSchema = z.object({
  appointmentId: z.string().min(1),
  newDate: z.string().min(1),
  newTimeSlot: z.string().min(1),
  reason: z.string().optional(),
  rescheduledBy: z.string().min(1)
});

export type CancellationData = z.infer<typeof cancellationSchema>;
export type ReschedulingData = z.infer<typeof reschedulingSchema>;

export const cancellationService = new CancellationService();
