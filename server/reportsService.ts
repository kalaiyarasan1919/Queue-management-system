import { storage } from './storage';
import { feedbackService } from './feedbackService';
import { auditService } from './auditService';

export interface DailyReport {
  date: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  averageWaitTime: number;
  priorityAppointments: {
    pwd: number;
    senior: number;
    emergency: number;
    vip: number;
  };
  departmentStats: Array<{
    departmentId: string;
    departmentName: string;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitTime: number;
  }>;
  serviceStats: Array<{
    serviceId: string;
    serviceName: string;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitTime: number;
  }>;
  feedbackStats: {
    totalFeedback: number;
    averageRating: number;
    recommendationRate: number;
  };
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  averageWaitTime: number;
  totalFeedback: number;
  averageRating: number;
  departmentStats: Array<{
    departmentId: string;
    departmentName: string;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitTime: number;
    averageRating: number;
  }>;
  trends: {
    dailyAppointments: Array<{ date: string; count: number }>;
    dailyWaitTimes: Array<{ date: string; averageWaitTime: number }>;
    dailyRatings: Array<{ date: string; averageRating: number }>;
  };
}

export interface AnalyticsDashboard {
  overview: {
    totalAppointments: number;
    todayAppointments: number;
    activeAppointments: number;
    completedToday: number;
    averageWaitTime: number;
    averageRating: number;
    totalFeedback: number;
  };
  realTimeStats: {
    currentQueue: number;
    servingNow: number;
    estimatedWaitTime: number;
    nextToken: string;
  };
  departmentPerformance: Array<{
    departmentId: string;
    departmentName: string;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitTime: number;
    averageRating: number;
    efficiency: number; // completed/total * 100
  }>;
  servicePerformance: Array<{
    serviceId: string;
    serviceName: string;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitTime: number;
    averageRating: number;
    efficiency: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
    userId?: string;
  }>;
}

export class ReportsService {
  /**
   * Generate daily report
   */
  static async generateDailyReport(date: Date): Promise<DailyReport> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get appointments for the day
    const appointments = await storage.getAppointmentsByDateRange(startOfDay, endOfDay);
    
    // Calculate basic stats
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    const noShowAppointments = appointments.filter(a => a.status === 'no_show').length;
    
    // Calculate average wait time
    const completedWithWaitTime = appointments.filter(a => 
      a.status === 'completed' && a.actualStartTime && a.actualEndTime
    );
    const averageWaitTime = this.calculateAverageWaitTime(completedWithWaitTime);

    // Calculate priority appointments
    const priorityAppointments = {
      pwd: appointments.filter(a => a.isPwd).length,
      senior: appointments.filter(a => a.isSeniorCitizen).length,
      emergency: appointments.filter(a => a.isEmergency).length,
      vip: appointments.filter(a => a.isVip).length
    };

    // Get department stats
    const departmentStats = await this.getDepartmentStats(appointments);

    // Get service stats
    const serviceStats = await this.getServiceStats(appointments);

    // Get feedback stats
    const feedbackStats = await this.getFeedbackStatsForDate(date);

    return {
      date: date.toISOString().split('T')[0],
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      averageWaitTime,
      priorityAppointments,
      departmentStats,
      serviceStats,
      feedbackStats
    };
  }

  /**
   * Generate monthly report
   */
  static async generateMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Get appointments for the month
    const appointments = await storage.getAppointmentsByDateRange(startOfMonth, endOfMonth);
    
    // Calculate basic stats
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    const noShowAppointments = appointments.filter(a => a.status === 'no_show').length;
    
    // Calculate average wait time
    const completedWithWaitTime = appointments.filter(a => 
      a.status === 'completed' && a.actualStartTime && a.actualEndTime
    );
    const averageWaitTime = this.calculateAverageWaitTime(completedWithWaitTime);

    // Get department stats with ratings
    const departmentStats = await this.getDepartmentStatsWithRatings(appointments);

    // Get trends
    const trends = await this.getMonthlyTrends(startOfMonth, endOfMonth);

    // Get feedback stats
    const feedbackStats = await this.getFeedbackStatsForMonth(year, month);
    const totalFeedback = feedbackStats.totalFeedback;
    const averageRating = feedbackStats.averageRating;

    return {
      month: month.toString().padStart(2, '0'),
      year,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      averageWaitTime,
      totalFeedback,
      averageRating,
      departmentStats,
      trends
    };
  }

  /**
   * Get analytics dashboard data
   */
  static async getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's appointments
    const todayAppointments = await storage.getAppointmentsByDateRange(startOfDay, endOfDay);
    
    // Get all appointments for overview
    const allAppointments = await storage.getAllAppointments();
    
    // Calculate overview stats
    const overview = {
      totalAppointments: allAppointments.length,
      todayAppointments: todayAppointments.length,
      activeAppointments: allAppointments.filter(a => 
        ['confirmed', 'waiting', 'serving'].includes(a.status)
      ).length,
      completedToday: todayAppointments.filter(a => a.status === 'completed').length,
      averageWaitTime: this.calculateAverageWaitTime(
        allAppointments.filter(a => a.status === 'completed' && a.actualStartTime && a.actualEndTime)
      ),
      averageRating: 0, // Will be calculated from feedback
      totalFeedback: 0 // Will be calculated from feedback
    };

    // Get real-time stats
    const realTimeStats = await this.getRealTimeStats();

    // Get department performance
    const departmentPerformance = await this.getDepartmentPerformance(allAppointments);

    // Get service performance
    const servicePerformance = await this.getServicePerformance(allAppointments);

    // Get recent activity
    const recentActivity = await this.getRecentActivity();

    // Get feedback stats
    const feedbackSummary = await feedbackService.getFeedbackSummary();
    overview.averageRating = feedbackSummary.averageRating;
    overview.totalFeedback = feedbackSummary.totalFeedback;

    return {
      overview,
      realTimeStats,
      departmentPerformance,
      servicePerformance,
      recentActivity
    };
  }

  /**
   * Export report to CSV
   */
  static async exportToCSV(
    reportType: 'daily' | 'monthly' | 'appointments',
    data: any,
    filename?: string
  ): Promise<string> {
    let csvContent = '';
    
    switch (reportType) {
      case 'daily':
        csvContent = this.convertDailyReportToCSV(data);
        break;
      case 'monthly':
        csvContent = this.convertMonthlyReportToCSV(data);
        break;
      case 'appointments':
        csvContent = this.convertAppointmentsToCSV(data);
        break;
    }

    const finalFilename = filename || `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    // In production, save to file system or cloud storage
    console.log(`CSV Export: ${finalFilename}`);
    console.log(csvContent);
    
    return csvContent;
  }

  /**
   * Get department stats
   */
  private static async getDepartmentStats(appointments: any[]): Promise<Array<{
    departmentId: string;
    departmentName: string;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitTime: number;
  }>> {
    const departmentMap = new Map();
    
    for (const appointment of appointments) {
      const department = await storage.getDepartment(appointment.departmentId);
      if (!department) continue;
      
      if (!departmentMap.has(appointment.departmentId)) {
        departmentMap.set(appointment.departmentId, {
          departmentId: appointment.departmentId,
          departmentName: department.name,
          totalAppointments: 0,
          completedAppointments: 0,
          waitTimes: []
        });
      }
      
      const deptStats = departmentMap.get(appointment.departmentId);
      deptStats.totalAppointments++;
      
      if (appointment.status === 'completed') {
        deptStats.completedAppointments++;
        if (appointment.actualStartTime && appointment.actualEndTime) {
          const waitTime = new Date(appointment.actualEndTime).getTime() - 
                          new Date(appointment.actualStartTime).getTime();
          deptStats.waitTimes.push(waitTime / (1000 * 60)); // Convert to minutes
        }
      }
    }
    
    return Array.from(departmentMap.values()).map(dept => ({
      departmentId: dept.departmentId,
      departmentName: dept.departmentName,
      totalAppointments: dept.totalAppointments,
      completedAppointments: dept.completedAppointments,
      averageWaitTime: dept.waitTimes.length > 0 ? 
        dept.waitTimes.reduce((sum: number, time: number) => sum + time, 0) / dept.waitTimes.length : 0
    }));
  }

  /**
   * Get service stats
   */
  private static async getServiceStats(appointments: any[]): Promise<Array<{
    serviceId: string;
    serviceName: string;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitTime: number;
  }>> {
    const serviceMap = new Map();
    
    for (const appointment of appointments) {
      const service = await storage.getService(appointment.serviceId);
      if (!service) continue;
      
      if (!serviceMap.has(appointment.serviceId)) {
        serviceMap.set(appointment.serviceId, {
          serviceId: appointment.serviceId,
          serviceName: service.name,
          totalAppointments: 0,
          completedAppointments: 0,
          waitTimes: []
        });
      }
      
      const serviceStats = serviceMap.get(appointment.serviceId);
      serviceStats.totalAppointments++;
      
      if (appointment.status === 'completed') {
        serviceStats.completedAppointments++;
        if (appointment.actualStartTime && appointment.actualEndTime) {
          const waitTime = new Date(appointment.actualEndTime).getTime() - 
                          new Date(appointment.actualStartTime).getTime();
          serviceStats.waitTimes.push(waitTime / (1000 * 60)); // Convert to minutes
        }
      }
    }
    
    return Array.from(serviceMap.values()).map(service => ({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      totalAppointments: service.totalAppointments,
      completedAppointments: service.completedAppointments,
      averageWaitTime: service.waitTimes.length > 0 ? 
        service.waitTimes.reduce((sum: number, time: number) => sum + time, 0) / service.waitTimes.length : 0
    }));
  }

  /**
   * Get department stats with ratings
   */
  private static async getDepartmentStatsWithRatings(appointments: any[]): Promise<Array<{
    departmentId: string;
    departmentName: string;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitTime: number;
    averageRating: number;
  }>> {
    const departmentStats = await this.getDepartmentStats(appointments);
    
    // Add ratings for each department
    for (const dept of departmentStats) {
      const feedbackStats = await feedbackService.getDepartmentFeedbackStatistics(dept.departmentId);
      dept.averageRating = feedbackStats.averageRating;
    }
    
    return departmentStats;
  }

  /**
   * Get service performance
   */
  private static async getServicePerformance(appointments: any[]): Promise<Array<{
    serviceId: string;
    serviceName: string;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitTime: number;
    averageRating: number;
    efficiency: number;
  }>> {
    const serviceStats = await this.getServiceStats(appointments);
    
    // Add ratings and efficiency for each service
    for (const service of serviceStats) {
      const feedbackStats = await feedbackService.getServiceFeedbackStatistics(service.serviceId);
      service.averageRating = feedbackStats.averageRating;
      service.efficiency = service.totalAppointments > 0 ? 
        (service.completedAppointments / service.totalAppointments) * 100 : 0;
    }
    
    return serviceStats;
  }

  /**
   * Get department performance
   */
  private static async getDepartmentPerformance(appointments: any[]): Promise<Array<{
    departmentId: string;
    departmentName: string;
    totalAppointments: number;
    completedAppointments: number;
    averageWaitTime: number;
    averageRating: number;
    efficiency: number;
  }>> {
    const departmentStats = await this.getDepartmentStatsWithRatings(appointments);
    
    // Add efficiency for each department
    for (const dept of departmentStats) {
      dept.efficiency = dept.totalAppointments > 0 ? 
        (dept.completedAppointments / dept.totalAppointments) * 100 : 0;
    }
    
    return departmentStats;
  }

  /**
   * Get real-time stats
   */
  private static async getRealTimeStats(): Promise<{
    currentQueue: number;
    servingNow: number;
    estimatedWaitTime: number;
    nextToken: string;
  }> {
    const today = new Date();
    const appointments = await storage.getAppointmentsByDate(today);
    
    const currentQueue = appointments.filter(a => a.status === 'waiting').length;
    const servingNow = appointments.filter(a => a.status === 'serving').length;
    
    // Calculate estimated wait time (simplified)
    const estimatedWaitTime = currentQueue * 15; // 15 minutes per person
    
    // Get next token
    const nextAppointment = appointments
      .filter(a => a.status === 'waiting')
      .sort((a, b) => a.queuePosition - b.queuePosition)[0];
    
    const nextToken = nextAppointment ? nextAppointment.tokenNumber : 'None';
    
    return {
      currentQueue,
      servingNow,
      estimatedWaitTime,
      nextToken
    };
  }

  /**
   * Get recent activity
   */
  private static async getRecentActivity(): Promise<Array<{
    type: string;
    description: string;
    timestamp: Date;
    userId?: string;
  }>> {
    const auditLogs = await auditService.getAuditLogs({ limit: 20 });
    
    return auditLogs.logs.map(log => ({
      type: log.action,
      description: this.formatAuditLogDescription(log),
      timestamp: log.createdAt,
      userId: log.userId
    }));
  }

  /**
   * Format audit log description
   */
  private static formatAuditLogDescription(log: any): string {
    switch (log.action) {
      case 'created':
        return `Appointment ${log.entityId} created`;
      case 'cancelled':
        return `Appointment ${log.entityId} cancelled`;
      case 'checked_in':
        return `Appointment ${log.entityId} checked in`;
      case 'no_show':
        return `Appointment ${log.entityId} marked as no-show`;
      case 'waitlist_added':
        return `Added to waitlist for ${log.entityId}`;
      case 'waitlist_assigned':
        return `Waitlist entry ${log.entityId} assigned`;
      default:
        return `${log.action} on ${log.entityType} ${log.entityId}`;
    }
  }

  /**
   * Calculate average wait time
   */
  private static calculateAverageWaitTime(appointments: any[]): number {
    if (appointments.length === 0) return 0;
    
    const totalWaitTime = appointments.reduce((sum, appointment) => {
      const startTime = new Date(appointment.actualStartTime).getTime();
      const endTime = new Date(appointment.actualEndTime).getTime();
      return sum + (endTime - startTime);
    }, 0);
    
    return totalWaitTime / (appointments.length * 1000 * 60); // Convert to minutes
  }

  /**
   * Get feedback stats for date
   */
  private static async getFeedbackStatsForDate(date: Date): Promise<{
    totalFeedback: number;
    averageRating: number;
    recommendationRate: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const feedbackStats = await feedbackService.getFeedbackStatistics({
      startDate: startOfDay,
      endDate: endOfDay
    });
    
    return {
      totalFeedback: feedbackStats.totalFeedback,
      averageRating: feedbackStats.averageRating,
      recommendationRate: feedbackStats.recommendationRate
    };
  }

  /**
   * Get feedback stats for month
   */
  private static async getFeedbackStatsForMonth(year: number, month: number): Promise<{
    totalFeedback: number;
    averageRating: number;
  }> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    
    const feedbackStats = await feedbackService.getFeedbackStatistics({
      startDate: startOfMonth,
      endDate: endOfMonth
    });
    
    return {
      totalFeedback: feedbackStats.totalFeedback,
      averageRating: feedbackStats.averageRating
    };
  }

  /**
   * Get monthly trends
   */
  private static async getMonthlyTrends(startDate: Date, endDate: Date): Promise<{
    dailyAppointments: Array<{ date: string; count: number }>;
    dailyWaitTimes: Array<{ date: string; averageWaitTime: number }>;
    dailyRatings: Array<{ date: string; averageRating: number }>;
  }> {
    // This would typically involve more complex queries
    // For now, return empty arrays
    return {
      dailyAppointments: [],
      dailyWaitTimes: [],
      dailyRatings: []
    };
  }

  /**
   * Convert daily report to CSV
   */
  private static convertDailyReportToCSV(report: DailyReport): string {
    let csv = 'Date,Total Appointments,Completed,Cancelled,No Show,Average Wait Time\n';
    csv += `${report.date},${report.totalAppointments},${report.completedAppointments},${report.cancelledAppointments},${report.noShowAppointments},${report.averageWaitTime}\n`;
    
    csv += '\nDepartment Stats\n';
    csv += 'Department,Total Appointments,Completed,Average Wait Time\n';
    report.departmentStats.forEach(dept => {
      csv += `${dept.departmentName},${dept.totalAppointments},${dept.completedAppointments},${dept.averageWaitTime}\n`;
    });
    
    return csv;
  }

  /**
   * Convert monthly report to CSV
   */
  private static convertMonthlyReportToCSV(report: MonthlyReport): string {
    let csv = 'Month,Year,Total Appointments,Completed,Cancelled,No Show,Average Wait Time,Average Rating\n';
    csv += `${report.month},${report.year},${report.totalAppointments},${report.completedAppointments},${report.cancelledAppointments},${report.noShowAppointments},${report.averageWaitTime},${report.averageRating}\n`;
    
    csv += '\nDepartment Stats\n';
    csv += 'Department,Total Appointments,Completed,Average Wait Time,Average Rating\n';
    report.departmentStats.forEach(dept => {
      csv += `${dept.departmentName},${dept.totalAppointments},${dept.completedAppointments},${dept.averageWaitTime},${dept.averageRating}\n`;
    });
    
    return csv;
  }

  /**
   * Convert appointments to CSV
   */
  private static convertAppointmentsToCSV(appointments: any[]): string {
    let csv = 'Token Number,Citizen Name,Department,Service,Date,Time Slot,Status,Priority,Wait Time\n';
    
    appointments.forEach(appointment => {
      const waitTime = appointment.actualStartTime && appointment.actualEndTime ? 
        ((new Date(appointment.actualEndTime).getTime() - new Date(appointment.actualStartTime).getTime()) / (1000 * 60)).toFixed(2) : 'N/A';
      
      csv += `${appointment.tokenNumber},${appointment.citizenName || 'N/A'},${appointment.departmentName || 'N/A'},${appointment.serviceName || 'N/A'},${new Date(appointment.appointmentDate).toLocaleDateString()},${appointment.timeSlot},${appointment.status},${appointment.priority},${waitTime}\n`;
    });
    
    return csv;
  }
}

export const reportsService = new ReportsService();
