/**
 * Integration module for connecting Node.js app with Django Reminder Service
 */

const axios = require('axios');

class ReminderService {
  constructor(reminderServiceUrl = 'http://localhost:8000') {
    this.baseUrl = reminderServiceUrl;
    this.apiUrl = `${reminderServiceUrl}/api`;
  }

  /**
   * Send a manual reminder for an appointment
   * @param {string} appointmentId - The appointment ID
   * @returns {Promise<Object>} Response from reminder service
   */
  async sendReminder(appointmentId) {
    try {
      const response = await axios.post(`${this.apiUrl}/reminders/send/${appointmentId}/`);
      return response.data;
    } catch (error) {
      console.error('Error sending reminder:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get reminder statistics
   * @returns {Promise<Object>} Reminder statistics
   */
  async getStats() {
    try {
      const response = await axios.get(`${this.apiUrl}/stats/`);
      return response.data;
    } catch (error) {
      console.error('Error getting stats:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check if reminder service is healthy
   * @returns {Promise<boolean>} Health status
   */
  async isHealthy() {
    try {
      const response = await axios.get(`${this.apiUrl}/health/`);
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Reminder service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Send test email
   * @returns {Promise<Object>} Test email response
   */
  async sendTestEmail() {
    try {
      const response = await axios.post(`${this.apiUrl}/test-email/`);
      return response.data;
    } catch (error) {
      console.error('Error sending test email:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get reminders for a specific appointment
   * @param {string} appointmentId - The appointment ID
   * @returns {Promise<Object>} Reminder details
   */
  async getReminder(appointmentId) {
    try {
      const response = await axios.get(`${this.apiUrl}/reminders/${appointmentId}/`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No reminder found
      }
      console.error('Error getting reminder:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get all reminders with optional filters
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of reminders
   */
  async getReminders(filters = {}) {
    try {
      const response = await axios.get(`${this.apiUrl}/reminders/`, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error getting reminders:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Export the class
module.exports = ReminderService;

// Example usage in your existing routes
const reminderService = new ReminderService(process.env.REMINDER_SERVICE_URL || 'http://localhost:8000');

// Add this to your existing appointment creation route
async function createAppointmentWithReminder(appointmentData) {
  try {
    // Create appointment in your existing system
    const appointment = await storage.createAppointment(appointmentData);
    
    // Ensure the appointment has the required fields for reminders
    const reminderData = {
      ...appointment,
      reminderSent: false,
      notificationEmail: appointment.notificationEmail || appointment.citizenEmail
    };
    
    // Update the appointment with reminder fields
    await storage.updateAppointment(appointment.id, {
      reminderSent: false,
      notificationEmail: reminderData.notificationEmail
    });
    
    console.log(`Appointment ${appointment.id} created and prepared for reminders`);
    return appointment;
    
  } catch (error) {
    console.error('Error creating appointment with reminder:', error);
    throw error;
  }
}

// Add this to your existing routes
function addReminderRoutes(app) {
  // Health check endpoint
  app.get('/api/reminder-service/health', async (req, res) => {
    try {
      const isHealthy = await reminderService.isHealthy();
      res.json({ 
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'reminder-service'
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'unhealthy', 
        error: error.message 
      });
    }
  });

  // Send manual reminder
  app.post('/api/appointments/:id/send-reminder', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await reminderService.sendReminder(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to send reminder',
        details: error.message 
      });
    }
  });

  // Get reminder statistics
  app.get('/api/reminder-service/stats', async (req, res) => {
    try {
      const stats = await reminderService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get stats',
        details: error.message 
      });
    }
  });

  // Send test email
  app.post('/api/reminder-service/test-email', async (req, res) => {
    try {
      const result = await reminderService.sendTestEmail();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to send test email',
        details: error.message 
      });
    }
  });
}

module.exports = {
  ReminderService,
  createAppointmentWithReminder,
  addReminderRoutes
};
