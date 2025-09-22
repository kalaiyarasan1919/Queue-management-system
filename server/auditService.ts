import { storage } from './storage';

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: 'appointment' | 'waitlist' | 'user' | 'department' | 'service' | 'counter';
  entityId: string;
  userId?: string;
  changes: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AuditLogFilter {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  /**
   * Log an action
   */
  static async logAction(data: {
    action: string;
    entityType: 'appointment' | 'waitlist' | 'user' | 'department' | 'service' | 'counter';
    entityId: string;
    userId?: string;
    changes?: Record<string, any>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const auditLog: AuditLogEntry = {
        id: this.generateId(),
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        changes: data.changes || {},
        reason: data.reason,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        createdAt: new Date()
      };

      await storage.createAuditLog(auditLog);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Log appointment creation
   */
  static async logAppointmentCreated(
    appointment: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'created',
      entityType: 'appointment',
      entityId: appointment.id,
      userId,
      changes: {
        tokenNumber: appointment.tokenNumber,
        citizenId: appointment.citizenId,
        departmentId: appointment.departmentId,
        serviceId: appointment.serviceId,
        appointmentDate: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        priority: appointment.priority,
        status: appointment.status
      },
      reason: 'Appointment created',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log appointment update
   */
  static async logAppointmentUpdated(
    appointmentId: string,
    oldData: any,
    newData: any,
    userId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const changes = this.calculateChanges(oldData, newData);
    
    if (Object.keys(changes).length > 0) {
      await this.logAction({
        action: 'updated',
        entityType: 'appointment',
        entityId: appointmentId,
        userId,
        changes,
        reason,
        ipAddress,
        userAgent
      });
    }
  }

  /**
   * Log appointment cancellation
   */
  static async logAppointmentCancelled(
    appointment: any,
    userId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'cancelled',
      entityType: 'appointment',
      entityId: appointment.id,
      userId,
      changes: {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: userId
      },
      reason: reason || 'Appointment cancelled',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log appointment rescheduling
   */
  static async logAppointmentRescheduled(
    oldAppointment: any,
    newAppointment: any,
    userId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'rescheduled',
      entityType: 'appointment',
      entityId: newAppointment.id,
      userId,
      changes: {
        oldAppointmentDate: oldAppointment.appointmentDate,
        newAppointmentDate: newAppointment.appointmentDate,
        oldTimeSlot: oldAppointment.timeSlot,
        newTimeSlot: newAppointment.timeSlot,
        rescheduledFrom: oldAppointment.id,
        rescheduledAt: new Date().toISOString()
      },
      reason: reason || 'Appointment rescheduled',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log check-in
   */
  static async logCheckIn(
    appointment: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'checked_in',
      entityType: 'appointment',
      entityId: appointment.id,
      userId,
      changes: {
        status: 'serving',
        checkedInAt: new Date().toISOString()
      },
      reason: 'Citizen checked in',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log no-show
   */
  static async logNoShow(
    appointment: any,
    userId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'no_show',
      entityType: 'appointment',
      entityId: appointment.id,
      userId,
      changes: {
        status: 'no_show',
        noShowAt: new Date().toISOString()
      },
      reason: reason || 'Citizen did not show up',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log waitlist addition
   */
  static async logWaitlistAdded(
    waitlistEntry: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'waitlist_added',
      entityType: 'waitlist',
      entityId: waitlistEntry.id,
      userId,
      changes: {
        citizenId: waitlistEntry.citizenId,
        departmentId: waitlistEntry.departmentId,
        serviceId: waitlistEntry.serviceId,
        preferredDate: waitlistEntry.preferredDate,
        position: waitlistEntry.position
      },
      reason: 'Added to waitlist',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log waitlist assignment
   */
  static async logWaitlistAssigned(
    waitlistEntry: any,
    appointment: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'waitlist_assigned',
      entityType: 'waitlist',
      entityId: waitlistEntry.id,
      userId,
      changes: {
        status: 'assigned',
        assignedAppointmentId: appointment.id,
        tokenNumber: appointment.tokenNumber
      },
      reason: 'Waitlist entry assigned to available slot',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log user login
   */
  static async logUserLogin(
    user: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'login',
      entityType: 'user',
      entityId: user.id,
      userId: user.id,
      changes: {
        lastLoginAt: new Date().toISOString()
      },
      reason: 'User logged in',
      ipAddress,
      userAgent
    });
  }

  /**
   * Log user logout
   */
  static async logUserLogout(
    user: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAction({
      action: 'logout',
      entityType: 'user',
      entityId: user.id,
      userId: user.id,
      changes: {
        lastLogoutAt: new Date().toISOString()
      },
      reason: 'User logged out',
      ipAddress,
      userAgent
    });
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(filter: AuditLogFilter = {}): Promise<{
    logs: AuditLogEntry[];
    total: number;
  }> {
    return await storage.getAuditLogs(filter);
  }

  /**
   * Get audit logs for specific entity
   */
  static async getEntityAuditLogs(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    const result = await this.getAuditLogs({
      entityType,
      entityId,
      limit
    });
    return result.logs;
  }

  /**
   * Get audit logs for specific user
   */
  static async getUserAuditLogs(
    userId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    const result = await this.getAuditLogs({
      userId,
      limit
    });
    return result.logs;
  }

  /**
   * Calculate changes between old and new data
   */
  private static calculateChanges(oldData: any, newData: any): Record<string, any> {
    const changes: Record<string, any> = {};
    
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key]
        };
      }
    }
    
    return changes;
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByEntity: Record<string, number>;
    recentActions: AuditLogEntry[];
  }> {
    const filter: AuditLogFilter = {
      startDate,
      endDate,
      limit: 1000 // Get more data for statistics
    };

    const result = await this.getAuditLogs(filter);
    const logs = result.logs;

    // Calculate statistics
    const actionsByType: Record<string, number> = {};
    const actionsByEntity: Record<string, number> = {};

    logs.forEach(log => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      actionsByEntity[log.entityType] = (actionsByEntity[log.entityType] || 0) + 1;
    });

    // Get recent actions (last 10)
    const recentActions = logs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalActions: logs.length,
      actionsByType,
      actionsByEntity,
      recentActions
    };
  }
}

export const auditService = new AuditService();
