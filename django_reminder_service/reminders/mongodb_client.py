"""
MongoDB client for connecting to the existing SmartQueue database
"""
import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pymongo import MongoClient
from django.conf import settings

logger = logging.getLogger(__name__)


class MongoDBClient:
    """Client for interacting with MongoDB database"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
        self._connect()
    
    def _connect(self):
        """Establish connection to MongoDB"""
        try:
            self.client = MongoClient(settings.MONGODB_SETTINGS['host'])
            self.db = self.client[settings.MONGODB_SETTINGS['db']]
            self.collection = self.db[settings.MONGODB_SETTINGS['collection']]
            logger.info("Successfully connected to MongoDB")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def get_appointments_for_reminder(self, minutes_before: int = 15) -> List[Dict]:
        """
        Get appointments that need reminder emails
        
        Args:
            minutes_before: Number of minutes before appointment to send reminder
            
        Returns:
            List of appointment documents
        """
        try:
            # Calculate the time window for reminders
            now = datetime.utcnow()
            reminder_time_start = now + timedelta(minutes=minutes_before - 1)
            reminder_time_end = now + timedelta(minutes=minutes_before + 1)
            
            # Query for appointments in the time window
            query = {
                'appointmentDate': {
                    '$gte': reminder_time_start,
                    '$lte': reminder_time_end
                },
                'status': {
                    '$in': ['waiting', 'confirmed', 'scheduled']
                },
                'reminderSent': {'$ne': True}  # Exclude already sent reminders
            }
            
            appointments = list(self.collection.find(query))
            logger.info(f"Found {len(appointments)} appointments for reminder")
            return appointments
            
        except Exception as e:
            logger.error(f"Error fetching appointments for reminder: {e}")
            return []
    
    def get_appointment_by_id(self, appointment_id: str) -> Optional[Dict]:
        """
        Get a specific appointment by ID
        
        Args:
            appointment_id: The appointment ID
            
        Returns:
            Appointment document or None
        """
        try:
            appointment = self.collection.find_one({'_id': appointment_id})
            return appointment
        except Exception as e:
            logger.error(f"Error fetching appointment {appointment_id}: {e}")
            return None
    
    def mark_reminder_sent(self, appointment_id: str) -> bool:
        """
        Mark reminder as sent for an appointment
        
        Args:
            appointment_id: The appointment ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = self.collection.update_one(
                {'_id': appointment_id},
                {
                    '$set': {
                        'reminderSent': True,
                        'reminderSentAt': datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error marking reminder sent for {appointment_id}: {e}")
            return False
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """
        Get user information by ID
        
        Args:
            user_id: The user ID
            
        Returns:
            User document or None
        """
        try:
            users_collection = self.db['users']
            user = users_collection.find_one({'_id': user_id})
            return user
        except Exception as e:
            logger.error(f"Error fetching user {user_id}: {e}")
            return None
    
    def get_department_by_id(self, department_id: str) -> Optional[Dict]:
        """
        Get department information by ID
        
        Args:
            department_id: The department ID
            
        Returns:
            Department document or None
        """
        try:
            departments_collection = self.db['departments']
            department = departments_collection.find_one({'_id': department_id})
            return department
        except Exception as e:
            logger.error(f"Error fetching department {department_id}: {e}")
            return None
    
    def get_service_by_id(self, service_id: str) -> Optional[Dict]:
        """
        Get service information by ID
        
        Args:
            service_id: The service ID
            
        Returns:
            Service document or None
        """
        try:
            services_collection = self.db['services']
            service = services_collection.find_one({'_id': service_id})
            return service
        except Exception as e:
            logger.error(f"Error fetching service {service_id}: {e}")
            return None
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")


# Global MongoDB client instance
mongodb_client = MongoDBClient()
