import { storage } from './storage';
import { notificationService } from './notificationService';
import { auditService } from './auditService';

export interface QueueStatus {
  departmentId: string;
  departmentName: string;
  serviceId: string;
  serviceName: string;
  currentToken: string | null;
  nextToken: string | null;
  queueLength: number;
  estimatedWaitTime: number; // in minutes
  averageServiceTime: number; // in minutes
  status: 'active' | 'paused' | 'closed';
  lastUpdated: Date;
}

export interface LiveQueueItem {
  tokenNumber: string;
  citizenName: string;
  appointmentDate: Date;
  timeSlot: string;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled' | 'no_show';
  queuePosition: number;
  estimatedWaitTime: number;
  priority: 'normal' | 'senior' | 'disabled' | 'emergency';
  isPwd: boolean;
  isSeniorCitizen: boolean;
  isVip: boolean;
  isEmergency: boolean;
  checkedInAt?: Date;
  calledAt?: Date;
  completedAt?: Date;
}

export interface QueueMetrics {
  totalServed: number;
  totalCancelled: number;
  totalNoShow: number;
  averageWaitTime: number;
  averageServiceTime: number;
  peakQueueLength: number;
  currentQueueLength: number;
  efficiency: number; // percentage
}

export class LiveQueueService {
  private static queueStatuses = new Map<string, QueueStatus>();
  private static liveQueues = new Map<string, LiveQueueItem[]>();
  private static metrics = new Map<string, QueueMetrics>();

  /**
   * Get live queue status for a department/service
   */
  static async getQueueStatus(
    departmentId: string,
    serviceId: string
  ): Promise<QueueStatus | null> {
    const key = `${departmentId}-${serviceId}`;
    return this.queueStatuses.get(key) || null;
  }

  /**
   * Get live queue items for a department/service
   */
  static async getLiveQueue(
    departmentId: string,
    serviceId: string
  ): Promise<LiveQueueItem[]> {
    const key = `${departmentId}-${serviceId}`;
    return this.liveQueues.get(key) || [];
  }

  /**
   * Update queue status
   */
  static async updateQueueStatus(
    departmentId: string,
    serviceId: string,
    status: 'active' | 'paused' | 'closed'
  ): Promise<void> {
    const key = `${departmentId}-${serviceId}`;
    const currentStatus = this.queueStatuses.get(key);
    
    if (currentStatus) {
      currentStatus.status = status;
      currentStatus.lastUpdated = new Date();
    } else {
      const department = await storage.getDepartment(departmentId);
      const service = await storage.getService(serviceId);
      
      this.queueStatuses.set(key, {
        departmentId,
        departmentName: department?.name || 'Unknown',
        serviceId,
        serviceName: service?.name || 'Unknown',
        currentToken: null,
        nextToken: null,
        queueLength: 0,
        estimatedWaitTime: 0,
        averageServiceTime: 0,
        status,
        lastUpdated: new Date()
      });
    }

    // Log status change
    await auditService.logAction({
      action: 'queue_status_changed',
      entityType: 'department',
      entityId: departmentId,
      changes: { status },
      reason: `Queue status changed to ${status}`
    });
  }

  /**
   * Call next token
   */
  static async callNextToken(
    departmentId: string,
    serviceId: string,
    counterId: string,
    calledBy: string
  ): Promise<{
    success: boolean;
    token?: LiveQueueItem;
    message: string;
  }> {
    const key = `${departmentId}-${serviceId}`;
    const queue = this.liveQueues.get(key) || [];
    
    // Find next token to call (prioritize by priority and position)
    const nextToken = this.findNextTokenToCall(queue);
    
    if (!nextToken) {
      return {
        success: false,
        message: 'No tokens available to call'
      };
    }

    // Update token status
    const updatedToken = await this.updateTokenStatus(
      nextToken.tokenNumber,
      'serving',
      calledBy,
      counterId
    );

    if (!updatedToken) {
      return {
        success: false,
        message: 'Failed to update token status'
      };
    }

    // Update queue status
    await this.updateQueueStatus(departmentId, serviceId, 'active');
    
    // Send notification
    await this.sendTokenCalledNotification(updatedToken);

    // Log action
    await auditService.logAction({
      action: 'token_called',
      entityType: 'appointment',
      entityId: updatedToken.tokenNumber,
      userId: calledBy,
      changes: { status: 'serving', calledAt: new Date() },
      reason: 'Token called by clerk'
    });

    return {
      success: true,
      token: updatedToken,
      message: `Token ${updatedToken.tokenNumber} called successfully`
    };
  }

  /**
   * Complete current token
   */
  static async completeToken(
    tokenNumber: string,
    completedBy: string,
    notes?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const updatedToken = await this.updateTokenStatus(
      tokenNumber,
      'completed',
      completedBy,
      undefined,
      notes
    );

    if (!updatedToken) {
      return {
        success: false,
        message: 'Failed to complete token'
      };
    }

    // Send completion notification
    await this.sendTokenCompletedNotification(updatedToken);

    // Log action
    await auditService.logAction({
      action: 'token_completed',
      entityType: 'appointment',
      entityId: tokenNumber,
      userId: completedBy,
      changes: { status: 'completed', completedAt: new Date() },
      reason: 'Token completed by clerk'
    });

    return {
      success: true,
      message: `Token ${tokenNumber} completed successfully`
    };
  }

  /**
   * Refresh live queue data
   */
  static async refreshLiveQueue(
    departmentId: string,
    serviceId: string
  ): Promise<void> {
    const today = new Date();
    const appointments = await storage.getAppointmentsByDate(today);
    
    // Filter appointments for this department/service
    const relevantAppointments = appointments.filter(apt => 
      apt.departmentId === departmentId && 
      apt.serviceId === serviceId &&
      ['confirmed', 'waiting', 'serving', 'completed', 'cancelled', 'no_show'].includes(apt.status)
    );

    // Convert to live queue items
    const liveQueueItems: LiveQueueItem[] = await Promise.all(
      relevantAppointments.map(async (apt) => {
        const user = await storage.getUser(apt.citizenId);
        const department = await storage.getDepartment(apt.departmentId);
        const service = await storage.getService(apt.serviceId);

        return {
          tokenNumber: apt.tokenNumber,
          citizenName: user?.firstName || 'Unknown',
          appointmentDate: new Date(apt.appointmentDate),
          timeSlot: apt.timeSlot,
          status: apt.status as any,
          queuePosition: apt.queuePosition || 0,
          estimatedWaitTime: apt.estimatedWaitTime || 0,
          priority: apt.priority as any,
          isPwd: apt.isPwd || false,
          isSeniorCitizen: apt.isSeniorCitizen || false,
          isVip: apt.isVip || false,
          isEmergency: apt.isEmergency || false,
          checkedInAt: apt.checkedInAt ? new Date(apt.checkedInAt) : undefined,
          calledAt: apt.actualStartTime ? new Date(apt.actualStartTime) : undefined,
          completedAt: apt.actualEndTime ? new Date(apt.actualEndTime) : undefined
        };
      })
    );

    // Sort by priority and position
    const sortedQueue = this.sortQueueByPriority(liveQueueItems);

    // Update live queue
    const key = `${departmentId}-${serviceId}`;
    this.liveQueues.set(key, sortedQueue);

    // Update queue status
    await this.updateQueueStatusFromQueue(departmentId, serviceId, sortedQueue);
  }

  /**
   * Get queue metrics
   */
  static async getQueueMetrics(
    departmentId: string,
    serviceId: string
  ): Promise<QueueMetrics> {
    const key = `${departmentId}-${serviceId}`;
    const queue = this.liveQueues.get(key) || [];
    
    const totalServed = queue.filter(item => item.status === 'completed').length;
    const totalCancelled = queue.filter(item => item.status === 'cancelled').length;
    const totalNoShow = queue.filter(item => item.status === 'no_show').length;
    const currentQueueLength = queue.filter(item => 
      ['waiting', 'serving'].includes(item.status)
    ).length;

    // Calculate average wait time
    const completedItems = queue.filter(item => 
      item.status === 'completed' && item.calledAt && item.completedAt
    );
    const averageWaitTime = completedItems.length > 0 ? 
      completedItems.reduce((sum, item) => {
        const waitTime = item.calledAt ? 
          (item.calledAt.getTime() - item.appointmentDate.getTime()) / (1000 * 60) : 0;
        return sum + waitTime;
      }, 0) / completedItems.length : 0;

    // Calculate average service time
    const averageServiceTime = completedItems.length > 0 ?
      completedItems.reduce((sum, item) => {
        const serviceTime = item.calledAt && item.completedAt ?
          (item.completedAt.getTime() - item.calledAt.getTime()) / (1000 * 60) : 0;
        return sum + serviceTime;
      }, 0) / completedItems.length : 0;

    // Calculate efficiency
    const totalProcessed = totalServed + totalCancelled + totalNoShow;
    const efficiency = totalProcessed > 0 ? (totalServed / totalProcessed) * 100 : 0;

    return {
      totalServed,
      totalCancelled,
      totalNoShow,
      averageWaitTime: Math.round(averageWaitTime * 100) / 100,
      averageServiceTime: Math.round(averageServiceTime * 100) / 100,
      peakQueueLength: Math.max(...queue.map(item => item.queuePosition), 0),
      currentQueueLength,
      efficiency: Math.round(efficiency * 100) / 100
    };
  }

  /**
   * Get all active queues
   */
  static async getAllActiveQueues(): Promise<QueueStatus[]> {
    return Array.from(this.queueStatuses.values()).filter(
      status => status.status === 'active'
    );
  }

  /**
   * Find next token to call based on priority
   */
  private static findNextTokenToCall(queue: LiveQueueItem[]): LiveQueueItem | null {
    // First, try to find emergency tokens
    let nextToken = queue.find(item => 
      item.status === 'waiting' && item.isEmergency
    );
    
    if (nextToken) return nextToken;

    // Then, try to find PwD tokens
    nextToken = queue.find(item => 
      item.status === 'waiting' && item.isPwd
    );
    
    if (nextToken) return nextToken;

    // Then, try to find senior citizen tokens
    nextToken = queue.find(item => 
      item.status === 'waiting' && item.isSeniorCitizen
    );
    
    if (nextToken) return nextToken;

    // Then, try to find VIP tokens
    nextToken = queue.find(item => 
      item.status === 'waiting' && item.isVip
    );
    
    if (nextToken) return nextToken;

    // Finally, find normal tokens by queue position
    nextToken = queue.find(item => 
      item.status === 'waiting' && item.priority === 'normal'
    );
    
    return nextToken || null;
  }

  /**
   * Update token status
   */
  private static async updateTokenStatus(
    tokenNumber: string,
    status: string,
    updatedBy: string,
    counterId?: string,
    notes?: string
  ): Promise<LiveQueueItem | null> {
    // Update in database
    await storage.updateAppointmentByToken(tokenNumber, {
      status,
      actualStartTime: status === 'serving' ? new Date().toISOString() : undefined,
      actualEndTime: status === 'completed' ? new Date().toISOString() : undefined,
      notes: notes ? `${notes} (Updated by ${updatedBy})` : undefined
    });

    // Update in live queue
    for (const [key, queue] of this.liveQueues.entries()) {
      const tokenIndex = queue.findIndex(item => item.tokenNumber === tokenNumber);
      if (tokenIndex !== -1) {
        queue[tokenIndex].status = status as any;
        if (status === 'serving') {
          queue[tokenIndex].calledAt = new Date();
        } else if (status === 'completed') {
          queue[tokenIndex].completedAt = new Date();
        }
        return queue[tokenIndex];
      }
    }

    return null;
  }

  /**
   * Sort queue by priority
   */
  private static sortQueueByPriority(queue: LiveQueueItem[]): LiveQueueItem[] {
    const priorityOrder = {
      'emergency': 1,
      'disabled': 2,
      'senior': 3,
      'normal': 4
    };

    return queue.sort((a, b) => {
      // First sort by priority
      const aPriority = priorityOrder[a.priority] || 4;
      const bPriority = priorityOrder[b.priority] || 4;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Then sort by queue position
      return a.queuePosition - b.queuePosition;
    });
  }

  /**
   * Update queue status from queue data
   */
  private static async updateQueueStatusFromQueue(
    departmentId: string,
    serviceId: string,
    queue: LiveQueueItem[]
  ): Promise<void> {
    const key = `${departmentId}-${serviceId}`;
    const currentStatus = this.queueStatuses.get(key);
    
    if (!currentStatus) return;

    const waitingItems = queue.filter(item => item.status === 'waiting');
    const servingItems = queue.filter(item => item.status === 'serving');
    
    const nextToken = waitingItems.length > 0 ? waitingItems[0].tokenNumber : null;
    const currentToken = servingItems.length > 0 ? servingItems[0].tokenNumber : null;

    // Calculate estimated wait time
    const averageServiceTime = 15; // minutes (simplified)
    const estimatedWaitTime = waitingItems.length * averageServiceTime;

    currentStatus.currentToken = currentToken;
    currentStatus.nextToken = nextToken;
    currentStatus.queueLength = waitingItems.length;
    currentStatus.estimatedWaitTime = estimatedWaitTime;
    currentStatus.averageServiceTime = averageServiceTime;
    currentStatus.lastUpdated = new Date();
  }

  /**
   * Send token called notification
   */
  private static async sendTokenCalledNotification(token: LiveQueueItem): Promise<void> {
    // This would send notification to the citizen
    // Implementation depends on notification service
    console.log(`Token ${token.tokenNumber} called - sending notification`);
  }

  /**
   * Send token completed notification
   */
  private static async sendTokenCompletedNotification(token: LiveQueueItem): Promise<void> {
    // This would send notification to the citizen
    // Implementation depends on notification service
    console.log(`Token ${token.tokenNumber} completed - sending notification`);
  }

  /**
   * Start queue monitoring
   */
  static startQueueMonitoring(): void {
    // Refresh all queues every 30 seconds
    setInterval(async () => {
      for (const [key, status] of this.queueStatuses.entries()) {
        if (status.status === 'active') {
          const [departmentId, serviceId] = key.split('-');
          await this.refreshLiveQueue(departmentId, serviceId);
        }
      }
    }, 30000);
  }
}

// Start monitoring when service is imported
LiveQueueService.startQueueMonitoring();

export const liveQueueService = new LiveQueueService();
