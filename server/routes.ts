import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDepartmentSchema, insertServiceSchema, insertCounterSchema, insertAppointmentSchema, insertAnnouncementSchema } from "@shared/schema";
import { SlotManager, slotBookingSchema } from "./slotManager";
import { emailService } from "./emailService";
import { aiSupportService, supportQuerySchema } from "./aiSupport";
import multer from "multer";
import { sendEmail } from "./authUtils";
import { z } from "zod";

// Reminder Service Integration
const REMINDER_SERVICE_URL = process.env.REMINDER_SERVICE_URL || 'http://localhost:8000';

async function callReminderService(endpoint: string, method: string = 'GET', data?: any) {
  try {
    const response = await fetch(`${REMINDER_SERVICE_URL}/api${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`Reminder service error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Reminder service call failed:', error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // File upload (PwD certificate)
  const upload = multer({ dest: "uploads/" });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const sessionUser = req.user;
      console.log('Auth user route - sessionUser:', sessionUser);

      // Replit OIDC user (has claims)
      if (sessionUser?.claims?.sub) {
        const userId = sessionUser.claims.sub;
        const user = await storage.getUser(userId);
        // Ensure user has a role
        if (user && !user.role) {
          user.role = 'citizen';
          await storage.updateUser(userId, { role: 'citizen' });
        }
        // Normalize user object for frontend
        const normalizedUser = {
          ...user,
          id: user?._id || user?.id,
          _id: user?._id || user?.id
        };
        return res.json(normalizedUser);
      }

      // Google/local users - fetch from database to get latest data including QR code
      if (sessionUser?.id || sessionUser?.email) {
        const userId = sessionUser.id || sessionUser._id;
        if (userId) {
          const user = await storage.getUser(userId);
          if (user) {
            // Ensure user has a role
            if (!user.role) {
              user.role = 'citizen';
              await storage.updateUser(userId, { role: 'citizen' });
            }
            // Normalize user object for frontend
            const normalizedUser = {
              ...user,
              id: user?._id || user?.id,
              _id: user?._id || user?.id
            };
            return res.json(normalizedUser);
          }
        }
        
        // If no userId but we have email, try to find user by email
        if (sessionUser.email) {
          const user = await storage.getUserByEmail(sessionUser.email);
          if (user) {
            // Ensure user has a role
            if (!user.role) {
              user.role = 'citizen';
              await storage.updateUser(user.id, { role: 'citizen' });
            }
            // Normalize user object for frontend
            const normalizedUser = {
              ...user,
              id: user?._id || user?.id,
              _id: user?._id || user?.id
            };
            return res.json(normalizedUser);
          }
        }
        
        // If no user found in database, create one with default role
        const newUser = await storage.createUser({
          ...sessionUser,
          role: 'citizen', // Always assign citizen role for new users
          email: sessionUser.email,
          name: sessionUser.name || sessionUser.displayName || 'User',
          profileImageUrl: sessionUser.picture || sessionUser.profileImageUrl || null,
          authProvider: 'google',
          providerId: sessionUser.id || sessionUser.sub,
          isEmailVerified: true
        });
        console.log('Created new user:', newUser);
        // Normalize user object for frontend
        const normalizedUser = {
          ...newUser,
          id: newUser?._id || newUser?.id,
          _id: newUser?._id || newUser?.id
        };
        return res.json(normalizedUser);
      }

      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dev-only route: promote current user to admin
  if (app.get('env') === 'development') {
    app.post('/api/dev/make-me-admin', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user?.claims?.sub || req.user?.id;
        if (!userId) return res.status(400).json({ message: 'No user in session' });
        const updated = await storage.updateUserRole(userId, 'admin');
        return res.json({ message: 'Role updated to admin', user: updated });
      } catch (error) {
        console.error('Error promoting user to admin:', error);
        return res.status(500).json({ message: 'Failed to promote user' });
      }
    });
  }

  // Get counter by clerk id (used by Clerk UI)
  app.get('/api/counters/by-clerk/:clerkId', isAuthenticated, async (req, res) => {
    try {
      const { clerkId } = req.params as any;
      const counter = await storage.getCounterByClerk(clerkId);
      res.json(counter || null);
    } catch (error) {
      console.error('Error fetching counter by clerk:', error);
      res.status(500).json({ message: 'Failed to fetch counter' });
    }
  });

  // Department routes
  app.get('/api/departments', async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Slot management routes
  app.get('/api/departments/:departmentId/slots/:date', async (req, res) => {
    try {
      const { departmentId, date } = req.params;
      const existingBookings = await storage.getAppointmentsByDate(date);
      const availableSlots = SlotManager.getAvailableSlots(departmentId, date, existingBookings);
      res.json(availableSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      res.status(500).json({ message: "Failed to fetch slots" });
    }
  });

  app.get('/api/departments/:departmentId/suggested-slots/:date', async (req, res) => {
    try {
      const { departmentId, date } = req.params;
      const existingBookings = await storage.getAppointmentsByDate(date);
      const suggestedSlots = SlotManager.getSuggestedSlots(departmentId, date, existingBookings);
      const capacityInfo = SlotManager.getCapacityInfo(departmentId, date, existingBookings);
      res.json({ 
        suggestedSlots, 
        capacityInfo,
        departmentConfig: SlotManager.getDepartmentConfig(departmentId)
      });
    } catch (error) {
      console.error("Error fetching suggested slots:", error);
      res.status(500).json({ message: "Failed to fetch suggested slots" });
    }
  });

  app.post('/api/departments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create departments" });
      }

      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating department:", error);
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  // Service routes
  app.get('/api/departments/:departmentId/services', async (req, res) => {
    try {
      const { departmentId } = req.params;
      const services = await storage.getServicesByDepartment(departmentId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create services" });
      }

      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Counter routes
  app.get('/api/departments/:departmentId/counters', async (req, res) => {
    try {
      const { departmentId } = req.params;
      const counters = await storage.getCountersByDepartment(departmentId);
      res.json(counters);
    } catch (error) {
      console.error("Error fetching counters:", error);
      res.status(500).json({ message: "Failed to fetch counters" });
    }
  });

  // List users by role (admin only)
  app.get('/api/users/:role', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user?.claims?.sub || req.user?.id;
      const requester = await storage.getUser(requesterId);
      if (requester?.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can list users by role' });
      }
      const { role } = req.params;
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users by role:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // Create counter - admin only
  app.post('/api/counters', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user?.claims?.sub || req.user?.id;
      const requester = await storage.getUser(requesterId);
      if (requester?.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can create counters' });
      }

      const validatedData = insertCounterSchema.parse(req.body);
      const counter = await storage.createCounter(validatedData);
      broadcastToClients({ type: 'COUNTER_CREATE', data: counter });
      res.json(counter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Error creating counter:', error);
      res.status(500).json({ message: 'Failed to create counter' });
    }
  });

  // Update counter (assign/unassign clerk, change number) - admin only
  app.patch('/api/counters/:counterId', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user?.claims?.sub || req.user?.id;
      const requester = await storage.getUser(requesterId);
      if (requester?.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can update counters' });
      }
      const { counterId } = req.params;
      const { clerkId, number } = req.body as { clerkId?: string | null; number?: number };
      const updatePayload: any = {};
      if (typeof clerkId !== 'undefined') updatePayload.clerkId = clerkId || null;
      if (typeof number !== 'undefined') updatePayload.number = number;
      const updated = await storage.updateCounter(counterId, updatePayload);
      broadcastToClients({ type: 'COUNTER_UPDATE', data: updated });
      res.json(updated);
    } catch (error) {
      console.error('Error updating counter:', error);
      res.status(500).json({ message: 'Failed to update counter' });
    }
  });

  app.patch('/api/counters/:counterId/status', isAuthenticated, async (req: any, res) => {
    try {
      const { counterId } = req.params;
      const { status } = req.body;
      
      const counter = await storage.updateCounterStatus(counterId, status);
      
      // Broadcast counter status update via WebSocket
      broadcastToClients({
        type: 'COUNTER_STATUS_UPDATE',
        data: counter
      });

      res.json(counter);
    } catch (error) {
      console.error("Error updating counter status:", error);
      res.status(500).json({ message: "Failed to update counter status" });
    }
  });

  // Appointment routes
  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      console.log('Fetching appointments for user ID:', userId);
      const user = await storage.getUser(userId);
      console.log('User found:', user ? 'Yes' : 'No', user?.role);
      
      let appointments;
      if (user?.role === 'admin') {
        appointments = await storage.getAppointments();
        console.log('Admin: Found', appointments.length, 'appointments');
      } else {
        appointments = await storage.getAppointmentsByUser(userId);
        console.log('Citizen: Found', appointments.length, 'appointments for user', userId);
      }
      
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      console.log('Appointment request body:', req.body);
      console.log('User ID:', userId);
      
      // Validate using slot booking schema
      const validatedData = slotBookingSchema.parse({
        ...req.body,
        citizenId: userId
      });
      console.log('Validated data:', validatedData);
      console.log('Storing appointment with citizenId:', validatedData.citizenId);
      
      // Check slot availability
      const existingBookings = await storage.getAppointmentsByDate(validatedData.appointmentDate);
      const isSlotAvailable = SlotManager.isSlotAvailable(
        validatedData.departmentId, 
        validatedData.appointmentDate, 
        validatedData.timeSlot, 
        existingBookings
      );
      
      if (!isSlotAvailable) {
        return res.status(400).json({ message: 'Selected time slot is no longer available' });
      }

      // Check daily booking limit
      const userBookings = existingBookings.filter(b => b.citizenId === userId);
      if (userBookings.length >= 1) {
        return res.status(400).json({ message: 'You already have a booking for this day' });
      }
      
      let appointment: any;
      try {
        // Add reminder fields to appointment data
        const appointmentData = {
          ...validatedData,
          reminderSent: false, // Important for reminder system
          notificationEmail: validatedData.notificationEmail || user?.email
        };
        
        appointment = await storage.createAppointment(appointmentData as any);
      } catch (e: any) {
        const msg = e?.message || 'Booking failed';
        return res.status(400).json({ message: msg });
      }

      // Send enhanced email notification
      const user = await storage.getUser(userId);
      const department = await storage.getDepartment(validatedData.departmentId);
      const service = await storage.getService(validatedData.serviceId);
      
      if (user && department && service) {
        const emailTemplate = emailService.generateBookingConfirmation(user, appointment, department, service);
        await emailService.sendEmail(appointment.notificationEmail, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
        
         // Schedule reminder email (40 minutes before appointment)
         const appointmentTime = new Date(appointment.appointmentDate);
         const reminderTime = new Date(appointmentTime.getTime() - 40 * 60000); // 40 minutes before
         const now = new Date();
         
         if (reminderTime > now) {
           setTimeout(async () => {
             const reminderTemplate = emailService.generateReminderEmail(user, appointment, department, service, 40);
            await emailService.sendEmail(appointment.notificationEmail, reminderTemplate.subject, reminderTemplate.html, reminderTemplate.text);
          }, reminderTime.getTime() - now.getTime());
        }
      }
      
      // Broadcast new appointment via WebSocket
      broadcastToClients({
        type: 'NEW_APPOINTMENT',
        data: appointment
      });

      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // PwD certificate upload endpoint (returns URL/path)
  const uploadSingleCert: any = upload.single('certificate');
  app.post('/api/uploads/pwd-certificate', isAuthenticated as any, uploadSingleCert, async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      // In production, move to cloud storage; for dev return local path
      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  // Age proof upload endpoint for senior citizens
  app.post('/api/uploads/age-proof', isAuthenticated as any, uploadSingleCert, async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      // In production, move to cloud storage; for dev return local path
      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Upload failed' });
    }
  });

  app.patch('/api/appointments/:appointmentId', isAuthenticated, async (req: any, res) => {
    try {
      const { appointmentId } = req.params;
      const appointment = await storage.updateAppointment(appointmentId, req.body);
      
      // Broadcast appointment update via WebSocket
      broadcastToClients({
        type: 'APPOINTMENT_UPDATE',
        data: appointment
      });

      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete('/api/appointments/:appointmentId', isAuthenticated, async (req: any, res) => {
    try {
      const { appointmentId } = req.params;
      await storage.deleteAppointment(appointmentId);
      
      // Broadcast appointment deletion via WebSocket
      broadcastToClients({
        type: 'APPOINTMENT_DELETED',
        data: { id: appointmentId }
      });

      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Mark no-show for an appointment (Clerk action)
  app.post('/api/appointments/:appointmentId/no-show', isAuthenticated, async (req: any, res) => {
    try {
      const { appointmentId } = req.params;
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

      const updated = await storage.updateAppointment(appointmentId, { status: 'no_show' } as any);
      // Broadcast update
      broadcastToClients({ type: 'APPOINTMENT_UPDATE', data: updated });
      res.json(updated);
    } catch (error) {
      console.error('Error marking no-show:', error);
      res.status(500).json({ message: 'Failed to mark no-show' });
    }
  });

  // Emergency walk-in insertion (Clerk)
  app.post('/api/departments/:departmentId/walkin', isAuthenticated, async (req: any, res) => {
    try {
      const { departmentId } = req.params;
      const userId = req.user?.claims?.sub || req.user?.id;
      const { serviceId, priority = 'emergency' } = req.body as { serviceId: string; priority?: string };
      if (!serviceId) return res.status(400).json({ message: 'serviceId is required' });

      const newAppt = await storage.createAppointment({
        citizenId: userId,
        departmentId,
        serviceId,
        appointmentDate: new Date() as any,
        timeSlot: 'WALK-IN',
        priority: priority as any,
        isPwd: false,
      } as any);

      // set to waiting explicitly
      const updated = await storage.updateAppointment(newAppt.id, { status: 'waiting' } as any);

      broadcastToClients({ type: 'QUEUE_UPDATE', data: { departmentId, currentServing: null, walkin: updated } });
      res.json(updated);
    } catch (error) {
      console.error('Error creating walk-in:', error);
      res.status(500).json({ message: 'Failed to create walk-in' });
    }
  });

  // Token validation for QR scanner
  app.post('/api/tokens/validate', isAuthenticated, async (req, res) => {
    try {
      const { tokenId } = req.body as any;
      if (!tokenId) return res.status(400).json({ valid: false, message: 'tokenId is required' });
      let token = tokenId as string;
      if (token.includes('://')) {
        // Expect format equeue://TOKEN/...
        const afterScheme = token.split('://')[1] || '';
        token = afterScheme.split('/')[0] || token;
      }
      const appt = await storage.getAppointmentByToken(token);
      if (!appt) return res.json({ valid: false, message: 'Token not found' });
      const todayStr = new Date().toDateString();
      const apptDayStr = new Date(appt.appointmentDate as any).toDateString();
      const invalidStatuses = ['completed', 'cancelled', 'no_show'];
      const valid = todayStr === apptDayStr && !invalidStatuses.includes(appt.status as any);
      return res.json({ valid, appointment: valid ? appt : undefined, message: valid ? 'OK' : 'Invalid for today' });
    } catch (error) {
      console.error('Error validating token:', error);
      res.status(500).json({ valid: false, message: 'Validation error' });
    }
  });

  // Queue routes
  app.get('/api/departments/:departmentId/queue', async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { date } = req.query;
      const queue = await storage.getQueueByDepartment(departmentId, date as string);
      res.json(queue);
    } catch (error) {
      console.error("Error fetching queue:", error);
      res.status(500).json({ message: "Failed to fetch queue" });
    }
  });

  app.post('/api/counters/:counterId/call-next', isAuthenticated, async (req: any, res) => {
    try {
      const { counterId } = req.params;
      const counter = await storage.getCounter(counterId);
      
      if (!counter) {
        return res.status(404).json({ message: "Counter not found" });
      }

      const nextAppointment = await storage.getNextInQueue(counter.departmentId, counterId);
      
      if (!nextAppointment) {
        return res.status(404).json({ message: "No appointments in queue" });
      }

      // Update appointment status and assign to counter
      const updatedAppointment = await storage.updateAppointment(nextAppointment.id, {
        status: 'serving',
        counterId: counterId,
        actualStartTime: new Date()
      });

      // Update counter status
      await storage.updateCounterStatus(counterId, 'busy');

      // Broadcast queue update via WebSocket
      broadcastToClients({
        type: 'QUEUE_UPDATE',
        data: {
          departmentId: counter.departmentId,
          currentServing: updatedAppointment,
          counterId: counterId
        }
      });

      // Near-turn alert: notify user 2 before
      try {
        const queue = await storage.getQueueByDepartment(counter.departmentId);
        const idx = queue.findIndex((a: any) => a.id === updatedAppointment.id);
        const alertIdx = idx + 2;
        if (alertIdx < queue.length) {
          const alertAppt: any = queue[alertIdx];
          const alertUser = await storage.getUser(alertAppt.citizenId);
          if (alertUser?.email) {
            await sendEmail(alertUser.email, `Your turn is near`, `Your token ${alertAppt.tokenNumber} will be served soon.`);
          } else {
            console.log(`[SMS-SIM] Near turn for token ${alertAppt.tokenNumber}`);
          }
        }
      } catch (e) {
        console.warn('Near-turn alert failed:', e);
      }

      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error calling next in queue:", error);
      res.status(500).json({ message: "Failed to call next in queue" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/system', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can view system analytics" });
      }

      const { date = new Date().toISOString().split('T')[0] } = req.query;
      const stats = await storage.getSystemStats(date as string);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system analytics:", error);
      res.status(500).json({ message: "Failed to fetch system analytics" });
    }
  });

  app.get('/api/analytics/department/:departmentId', isAuthenticated, async (req: any, res) => {
    try {
      const { departmentId } = req.params;
      const { date = new Date().toISOString().split('T')[0] } = req.query;
      const stats = await storage.getDepartmentStats(departmentId, date as string);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching department analytics:", error);
      res.status(500).json({ message: "Failed to fetch department analytics" });
    }
  });

  // CSV export for analytics (admin only)
  app.get('/api/analytics/export', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user?.claims?.sub || req.user?.id;
      const requester = await storage.getUser(requesterId);
      if (requester?.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can export analytics' });
      }
      const date = (req.query?.date as string) || new Date().toISOString().split('T')[0];
      const appts = await storage.getAppointmentsByDate(date);
      const header = [
        'tokenNumber','citizenId','departmentId','serviceId','status','priority','appointmentDate','timeSlot','queuePosition','estimatedWaitTime'
      ];
      const rows = appts.map((a: any) => [
        a.tokenNumber,
        a.citizenId,
        a.departmentId,
        a.serviceId,
        a.status,
        a.priority,
        new Date(a.appointmentDate).toISOString(),
        a.timeSlot,
        a.queuePosition ?? '',
        a.estimatedWaitTime ?? ''
      ]);
      const csv = [header, ...rows].map(r => r.map(v => (v !== null && v !== undefined ? String(v).replaceAll('"', '""') : '')).map(v => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics_${date}.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      console.error('Error exporting analytics CSV:', error);
      res.status(500).json({ message: 'Failed to export CSV' });
    }
  });

  // Announcement routes
  app.get('/api/announcements', async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create announcements" });
      }

      const validatedData = insertAnnouncementSchema.parse({
        ...req.body,
        createdBy: userId
      });
      
      const announcement = await storage.createAnnouncement(validatedData);
      
      // Broadcast new announcement via WebSocket
      broadcastToClients({
        type: 'NEW_ANNOUNCEMENT',
        data: announcement
      });

      res.json(announcement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // AI Support routes
  app.post('/api/support/chat', async (req, res) => {
    try {
      const { query, userId } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query is required' });
      }

      const aiResponse = aiSupportService.analyzeQuery(query);
      
      // Log the interaction for analytics
      console.log(`🤖 AI Support Query: "${query}" | Category: ${aiResponse.category} | Confidence: ${aiResponse.confidence} | Priority: ${aiResponse.priority}`);
      
      // If requires human intervention, send notification
      if (aiResponse.requiresHuman) {
        const escalationMessage = aiSupportService.generateEscalationMessage(query, aiResponse.priority);
        console.log(`🚨 ESCALATION REQUIRED: ${escalationMessage}`);
        
        // In a real system, you'd send this to a support team
        // For now, we'll just log it
      }

      res.json({
        response: aiResponse.response,
        confidence: aiResponse.confidence,
        suggestedActions: aiResponse.suggestedActions,
        category: aiResponse.category,
        priority: aiResponse.priority,
        requiresHuman: aiResponse.requiresHuman,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing AI support query:', error);
      res.status(500).json({ message: 'Failed to process support query' });
    }
  });

  app.get('/api/support/faq', async (req, res) => {
    try {
      const faq = aiSupportService.generateFAQ();
      res.json(faq);
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      res.status(500).json({ message: 'Failed to fetch FAQ' });
    }
  });

  app.get('/api/support/categories', async (req, res) => {
    try {
      const categories = [
        { id: 'booking', name: 'Booking & Appointments', icon: 'calendar', color: 'blue' },
        { id: 'technical', name: 'Technical Issues', icon: 'settings', color: 'red' },
        { id: 'pwd', name: 'PwD Support', icon: 'accessibility', color: 'green' },
        { id: 'general', name: 'General Information', icon: 'help-circle', color: 'purple' },
        { id: 'refund', name: 'Payment & Billing', icon: 'credit-card', color: 'orange' }
      ];
      res.json(categories);
    } catch (error) {
      console.error('Error fetching support categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  // Reminder Service Integration Routes
  app.get('/api/reminder-service/health', async (req, res) => {
    try {
      const health = await callReminderService('/health/');
      res.json(health);
    } catch (error) {
      res.status(500).json({ 
        status: 'unhealthy', 
        error: 'Reminder service unavailable' 
      });
    }
  });

  app.post('/api/appointments/:id/send-reminder', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await callReminderService(`/reminders/send/${id}/`, 'POST');
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to send reminder',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/reminder-service/stats', async (req, res) => {
    try {
      const stats = await callReminderService('/stats/');
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get reminder stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/reminder-service/test-email', async (req, res) => {
    try {
      const result = await callReminderService('/test-email/', 'POST');
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  function broadcastToClients(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('New WebSocket connection established');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return httpServer;
}
