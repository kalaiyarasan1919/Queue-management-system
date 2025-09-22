import { z } from 'zod';
import { storage } from './storage';
import { notificationService } from './notificationService';

export interface FeedbackData {
  id: string;
  appointmentId: string;
  citizenId: string;
  rating: number; // 1-5 stars
  comment?: string;
  serviceQuality: number; // 1-5
  waitTime: number; // 1-5
  staffCourtesy: number; // 1-5
  overallSatisfaction: number; // 1-5
  wouldRecommend: boolean;
  createdAt: Date;
}

export interface FeedbackStatistics {
  totalFeedback: number;
  averageRating: number;
  averageServiceQuality: number;
  averageWaitTime: number;
  averageStaffCourtesy: number;
  averageOverallSatisfaction: number;
  recommendationRate: number;
  ratingDistribution: Record<number, number>;
  recentFeedback: FeedbackData[];
}

export interface FeedbackFilter {
  appointmentId?: string;
  citizenId?: string;
  departmentId?: string;
  serviceId?: string;
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class FeedbackService {
  /**
   * Submit feedback for an appointment
   */
  static async submitFeedback(data: {
    appointmentId: string;
    citizenId: string;
    rating: number;
    comment?: string;
    serviceQuality: number;
    waitTime: number;
    staffCourtesy: number;
    overallSatisfaction: number;
    wouldRecommend: boolean;
  }): Promise<FeedbackData> {
    // Validate feedback data
    const validatedData = feedbackSubmissionSchema.parse(data);

    // Check if appointment exists and is completed
    const appointment = await storage.getAppointment(data.appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status !== 'completed') {
      throw new Error('Feedback can only be submitted for completed appointments');
    }

    // Check if feedback already exists
    const existingFeedback = await storage.getFeedbackByAppointment(data.appointmentId);
    if (existingFeedback) {
      throw new Error('Feedback already submitted for this appointment');
    }

    // Create feedback
    const feedback = await storage.createFeedback(validatedData);

    // Update appointment with feedback status
    await storage.updateAppointment(data.appointmentId, {
      feedbackSubmitted: true,
      feedbackRating: data.rating,
      feedbackComment: data.comment
    });

    // Send thank you notification
    await this.sendFeedbackThankYouNotification(appointment, feedback);

    return feedback;
  }

  /**
   * Get feedback for a specific appointment
   */
  static async getFeedbackByAppointment(appointmentId: string): Promise<FeedbackData | null> {
    return await storage.getFeedbackByAppointment(appointmentId);
  }

  /**
   * Get feedback for a specific citizen
   */
  static async getFeedbackByCitizen(citizenId: string, limit: number = 20): Promise<FeedbackData[]> {
    return await storage.getFeedbackByCitizen(citizenId, limit);
  }

  /**
   * Get feedback with filtering
   */
  static async getFeedback(filter: FeedbackFilter = {}): Promise<{
    feedback: FeedbackData[];
    total: number;
  }> {
    return await storage.getFeedback(filter);
  }

  /**
   * Get feedback statistics
   */
  static async getFeedbackStatistics(filter: {
    departmentId?: string;
    serviceId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<FeedbackStatistics> {
    const result = await this.getFeedback(filter);
    const feedback = result.feedback;

    if (feedback.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        averageServiceQuality: 0,
        averageWaitTime: 0,
        averageStaffCourtesy: 0,
        averageOverallSatisfaction: 0,
        recommendationRate: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentFeedback: []
      };
    }

    // Calculate averages
    const totalFeedback = feedback.length;
    const averageRating = this.calculateAverage(feedback.map(f => f.rating));
    const averageServiceQuality = this.calculateAverage(feedback.map(f => f.serviceQuality));
    const averageWaitTime = this.calculateAverage(feedback.map(f => f.waitTime));
    const averageStaffCourtesy = this.calculateAverage(feedback.map(f => f.staffCourtesy));
    const averageOverallSatisfaction = this.calculateAverage(feedback.map(f => f.overallSatisfaction));
    const recommendationRate = (feedback.filter(f => f.wouldRecommend).length / totalFeedback) * 100;

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach(f => {
      ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
    });

    // Get recent feedback (last 10)
    const recentFeedback = feedback
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalFeedback,
      averageRating: Math.round(averageRating * 100) / 100,
      averageServiceQuality: Math.round(averageServiceQuality * 100) / 100,
      averageWaitTime: Math.round(averageWaitTime * 100) / 100,
      averageStaffCourtesy: Math.round(averageStaffCourtesy * 100) / 100,
      averageOverallSatisfaction: Math.round(averageOverallSatisfaction * 100) / 100,
      recommendationRate: Math.round(recommendationRate * 100) / 100,
      ratingDistribution,
      recentFeedback
    };
  }

  /**
   * Get feedback statistics for a specific department
   */
  static async getDepartmentFeedbackStatistics(departmentId: string): Promise<FeedbackStatistics> {
    return await this.getFeedbackStatistics({ departmentId });
  }

  /**
   * Get feedback statistics for a specific service
   */
  static async getServiceFeedbackStatistics(serviceId: string): Promise<FeedbackStatistics> {
    return await this.getFeedbackStatistics({ serviceId });
  }

  /**
   * Send feedback request notification
   */
  static async sendFeedbackRequest(appointment: any): Promise<void> {
    const user = await storage.getUser(appointment.citizenId);
    const department = await storage.getDepartment(appointment.departmentId);
    const service = await storage.getService(appointment.serviceId);

    const feedbackLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/feedback/${appointment.id}`;

    await notificationService.sendNotification({
      to: appointment.notificationEmail,
      channel: appointment.preferredChannel || 'email',
      template: 'feedback_request',
      variables: {
        firstName: user.firstName,
        tokenNumber: appointment.tokenNumber,
        feedbackLink
      }
    });
  }

  /**
   * Send feedback thank you notification
   */
  private static async sendFeedbackThankYouNotification(
    appointment: any,
    feedback: FeedbackData
  ): Promise<void> {
    const user = await storage.getUser(appointment.citizenId);

    await notificationService.sendNotification({
      to: appointment.notificationEmail,
      channel: appointment.preferredChannel || 'email',
      template: 'feedback_thank_you',
      variables: {
        firstName: user.firstName,
        tokenNumber: appointment.tokenNumber,
        rating: feedback.rating
      }
    });
  }

  /**
   * Calculate average of numbers
   */
  private static calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Get feedback trends over time
   */
  static async getFeedbackTrends(
    departmentId?: string,
    serviceId?: string,
    days: number = 30
  ): Promise<{
    date: string;
    averageRating: number;
    totalFeedback: number;
  }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.getFeedback({
      departmentId,
      serviceId,
      startDate,
      endDate,
      limit: 1000
    });

    // Group by date
    const groupedByDate: Record<string, FeedbackData[]> = {};
    result.feedback.forEach(feedback => {
      const date = new Date(feedback.createdAt).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(feedback);
    });

    // Calculate trends
    const trends = Object.entries(groupedByDate).map(([date, feedbacks]) => ({
      date,
      averageRating: this.calculateAverage(feedbacks.map(f => f.rating)),
      totalFeedback: feedbacks.length
    }));

    return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get feedback summary for admin dashboard
   */
  static async getFeedbackSummary(): Promise<{
    totalFeedback: number;
    averageRating: number;
    recentFeedback: FeedbackData[];
    topRatedServices: Array<{ serviceId: string; serviceName: string; averageRating: number; totalFeedback: number }>;
    lowRatedServices: Array<{ serviceId: string; serviceName: string; averageRating: number; totalFeedback: number }>;
  }> {
    const statistics = await this.getFeedbackStatistics();
    const recentFeedback = await this.getRecentFeedback(10);
    
    // Get service ratings
    const services = await storage.getAllServices();
    const serviceRatings = await Promise.all(
      services.map(async (service) => {
        const serviceStats = await this.getServiceFeedbackStatistics(service.id);
        return {
          serviceId: service.id,
          serviceName: service.name,
          averageRating: serviceStats.averageRating,
          totalFeedback: serviceStats.totalFeedback
        };
      })
    );

    const topRatedServices = serviceRatings
      .filter(s => s.totalFeedback > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    const lowRatedServices = serviceRatings
      .filter(s => s.totalFeedback > 0)
      .sort((a, b) => a.averageRating - b.averageRating)
      .slice(0, 5);

    return {
      totalFeedback: statistics.totalFeedback,
      averageRating: statistics.averageRating,
      recentFeedback,
      topRatedServices,
      lowRatedServices
    };
  }

  /**
   * Get recent feedback
   */
  private static async getRecentFeedback(limit: number = 10): Promise<FeedbackData[]> {
    const result = await this.getFeedback({ limit });
    return result.feedback
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

// Validation schemas
export const feedbackSubmissionSchema = z.object({
  appointmentId: z.string().min(1),
  citizenId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  serviceQuality: z.number().min(1).max(5),
  waitTime: z.number().min(1).max(5),
  staffCourtesy: z.number().min(1).max(5),
  overallSatisfaction: z.number().min(1).max(5),
  wouldRecommend: z.boolean()
});

export type FeedbackSubmissionData = z.infer<typeof feedbackSubmissionSchema>;

export const feedbackService = new FeedbackService();
