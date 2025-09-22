import { Router } from 'express';
import { z } from 'zod';
import { waitlistManager } from './waitlistManager';
import { notificationService } from './notificationService';
import { qrCodeService } from './qrCodeService';
import { auditService } from './auditService';
import { feedbackService } from './feedbackService';
import { reportsService } from './reportsService';
import { cancellationService } from './cancellationService';
import { noShowService } from './noShowService';
import { liveQueueService } from './liveQueueService';
import { storage } from './storage';

const router = Router();

// Waitlist routes
router.post('/waitlist/add', async (req, res) => {
  try {
    const data = waitlistManager.waitlistSchema.parse(req.body);
    const waitlistEntry = await waitlistManager.addToWaitlist(data);
    res.json({ success: true, data: waitlistEntry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/waitlist/status/:citizenId', async (req, res) => {
  try {
    const { citizenId } = req.params;
    const waitlistStatus = await waitlistManager.getWaitlistStatus(citizenId);
    res.json({ success: true, data: waitlistStatus });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/waitlist/admin/:departmentId/:serviceId', async (req, res) => {
  try {
    const { departmentId, serviceId } = req.params;
    const date = new Date(req.query.date as string);
    const waitlist = await waitlistManager.getWaitlistForAdmin(departmentId, serviceId, date);
    res.json({ success: true, data: waitlist });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// QR Code and OTP routes
router.post('/appointments/:id/qr-code', async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await storage.getAppointment(id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const qrCodeData = await qrCodeService.generateQRCode(appointment);
    res.json({ success: true, data: qrCodeData });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/appointments/:id/otp', async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await storage.getAppointment(id);
    if (!appointment) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    const otpData = qrCodeService.generateOTP(appointment);
    res.json({ success: true, data: { code: otpData.code, expiresAt: otpData.expiresAt } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/checkin/qr', async (req, res) => {
  try {
    const { qrCodeData } = req.body;
    const verification = qrCodeService.verifyQRCode(qrCodeData);
    
    if (!verification.valid) {
      return res.status(400).json({ success: false, error: verification.error });
    }

    // Update appointment status to checked in
    await storage.updateAppointment(verification.appointmentId!, {
      status: 'waiting',
      checkedInAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Check-in successful' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/checkin/otp', async (req, res) => {
  try {
    const { appointmentId, code } = req.body;
    const verification = qrCodeService.verifyOTP(appointmentId, code);
    
    if (!verification.valid) {
      return res.status(400).json({ success: false, error: verification.error });
    }

    // Update appointment status to checked in
    await storage.updateAppointment(appointmentId, {
      status: 'waiting',
      checkedInAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Check-in successful' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Cancellation and rescheduling routes
router.post('/appointments/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const data = cancellationService.cancellationSchema.parse(req.body);
    data.appointmentId = id;
    
    const result = await cancellationService.cancelAppointment(data);
    res.json({ success: result.success, message: result.message, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/appointments/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const data = cancellationService.reschedulingSchema.parse(req.body);
    data.appointmentId = id;
    
    const result = await cancellationService.rescheduleAppointment(data);
    res.json({ success: result.success, message: result.message, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// No-show handling routes
router.post('/appointments/:id/no-show', async (req, res) => {
  try {
    const { id } = req.params;
    const { markedBy, reason } = req.body;
    
    const noShowRecord = await noShowService.markAsNoShow(id, markedBy, reason);
    res.json({ success: true, data: noShowRecord });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/appointments/:id/reactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const { reactivatedBy, reason } = req.body;
    
    const success = await noShowService.reactivateAppointment(id, reactivatedBy, reason);
    res.json({ success, message: 'Appointment reactivated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/no-show/process', async (req, res) => {
  try {
    const result = await noShowService.processNoShows();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Live queue routes
router.get('/queue/:departmentId/:serviceId', async (req, res) => {
  try {
    const { departmentId, serviceId } = req.params;
    const queueStatus = await liveQueueService.getQueueStatus(departmentId, serviceId);
    const liveQueue = await liveQueueService.getLiveQueue(departmentId, serviceId);
    
    res.json({ success: true, data: { queueStatus, liveQueue } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/queue/:departmentId/:serviceId/status', async (req, res) => {
  try {
    const { departmentId, serviceId } = req.params;
    const { status } = req.body;
    
    await liveQueueService.updateQueueStatus(departmentId, serviceId, status);
    res.json({ success: true, message: 'Queue status updated' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/queue/:departmentId/:serviceId/call-next', async (req, res) => {
  try {
    const { departmentId, serviceId } = req.params;
    const { counterId, calledBy } = req.body;
    
    const result = await liveQueueService.callNextToken(departmentId, serviceId, counterId, calledBy);
    res.json({ success: result.success, message: result.message, data: result.token });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/queue/complete-token', async (req, res) => {
  try {
    const { tokenNumber, completedBy, notes } = req.body;
    
    const result = await liveQueueService.completeToken(tokenNumber, completedBy, notes);
    res.json({ success: result.success, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/queue/metrics/:departmentId/:serviceId', async (req, res) => {
  try {
    const { departmentId, serviceId } = req.params;
    const metrics = await liveQueueService.getQueueMetrics(departmentId, serviceId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Feedback routes
router.post('/feedback/submit', async (req, res) => {
  try {
    const data = feedbackService.feedbackSubmissionSchema.parse(req.body);
    const feedback = await feedbackService.submitFeedback(data);
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/feedback/appointment/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const feedback = await feedbackService.getFeedbackByAppointment(appointmentId);
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/feedback/citizen/:citizenId', async (req, res) => {
  try {
    const { citizenId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const feedback = await feedbackService.getFeedbackByCitizen(citizenId, limit);
    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/feedback/statistics', async (req, res) => {
  try {
    const { departmentId, serviceId, startDate, endDate } = req.query;
    const filter: any = {};
    
    if (departmentId) filter.departmentId = departmentId;
    if (serviceId) filter.serviceId = serviceId;
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);
    
    const statistics = await feedbackService.getFeedbackStatistics(filter);
    res.json({ success: true, data: statistics });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Reports routes
router.get('/reports/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const report = await reportsService.generateDailyReport(new Date(date));
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reports/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const report = await reportsService.generateMonthlyReport(parseInt(year), parseInt(month));
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reports/analytics', async (req, res) => {
  try {
    const dashboard = await reportsService.getAnalyticsDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/reports/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { data, filename } = req.query;
    
    const csvContent = await reportsService.exportToCSV(
      type as any,
      JSON.parse(data as string),
      filename as string
    );
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || `${type}_report.csv`}"`);
    res.send(csvContent);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Audit routes
router.get('/audit/logs', async (req, res) => {
  try {
    const { entityType, entityId, userId, action, startDate, endDate, limit, offset } = req.query;
    const filter: any = {};
    
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);
    if (limit) filter.limit = parseInt(limit as string);
    if (offset) filter.offset = parseInt(offset as string);
    
    const result = await auditService.getAuditLogs(filter);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/audit/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const statistics = await auditService.getAuditStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, data: statistics });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Notification routes
router.post('/notifications/send', async (req, res) => {
  try {
    const { to, channel, template, variables, priority } = req.body;
    const success = await notificationService.sendNotification({
      to,
      channel,
      template,
      variables,
      priority
    });
    res.json({ success, message: success ? 'Notification sent' : 'Failed to send notification' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/notifications/send-batch', async (req, res) => {
  try {
    const { notifications } = req.body;
    const result = await notificationService.sendBatchNotifications(notifications);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/notifications/channels', async (req, res) => {
  try {
    const channels = notificationService.getChannelStatus();
    res.json({ success: true, data: channels });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/notifications/configure-channel', async (req, res) => {
  try {
    const { channel, enabled, config } = req.body;
    notificationService.configureChannel(channel, enabled, config);
    res.json({ success: true, message: 'Channel configuration updated' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// System routes
router.get('/system/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        email: 'configured',
        sms: 'simulated',
        whatsapp: 'simulated'
      },
      uptime: process.uptime()
    };
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/system/statistics', async (req, res) => {
  try {
    const statistics = {
      totalAppointments: 0, // Would be calculated from database
      activeQueues: 0,
      totalUsers: 0,
      systemUptime: process.uptime()
    };
    res.json({ success: true, data: statistics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
