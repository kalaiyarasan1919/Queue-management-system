import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDepartmentSchema, insertServiceSchema, insertCounterSchema, insertAppointmentSchema, insertAnnouncementSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  app.post('/api/departments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      let appointments;
      if (user?.role === 'admin') {
        appointments = await storage.getAppointments();
      } else {
        appointments = await storage.getAppointmentsByUser(userId);
      }
      
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertAppointmentSchema.parse({
        ...req.body,
        citizenId: userId
      });
      
      const appointment = await storage.createAppointment(validatedData);
      
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

      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error calling next in queue:", error);
      res.status(500).json({ message: "Failed to call next in queue" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/system', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
