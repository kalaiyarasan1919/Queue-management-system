#!/usr/bin/env python3
"""
Setup script for SmartQueue Reminder Service
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def main():
    """Main setup function"""
    print("🚀 Setting up SmartQueue Reminder Service...")
    
    # Check if Python is available
    if not shutil.which('python3'):
        print("❌ Python 3 is required but not found")
        sys.exit(1)
    
    # Check if pip is available
    if not shutil.which('pip3'):
        print("❌ pip3 is required but not found")
        sys.exit(1)
    
    # Install requirements
    if not run_command("pip3 install -r requirements.txt", "Installing Python dependencies"):
        sys.exit(1)
    
    # Create logs directory
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    print("✅ Created logs directory")
    
    # Create .env file if it doesn't exist
    if not Path(".env").exists():
        if Path("env.example").exists():
            shutil.copy("env.example", ".env")
            print("✅ Created .env file from template")
            print("⚠️  Please edit .env file with your actual configuration")
        else:
            print("❌ env.example file not found")
    
    # Run Django migrations
    if not run_command("python3 manage.py migrate", "Running Django migrations"):
        print("⚠️  Database migrations failed. Please check your database configuration.")
    
    # Setup reminder service
    if not run_command("python3 manage.py setup_reminder_service", "Setting up reminder service"):
        print("⚠️  Reminder service setup failed. You can run this manually later.")
    
    print("\n🎉 Setup completed!")
    print("\n📋 Next steps:")
    print("1. Edit .env file with your configuration")
    print("2. Start Redis: redis-server")
    print("3. Start Celery worker: celery -A reminder_service worker --loglevel=info")
    print("4. Start Celery beat: celery -A reminder_service beat --loglevel=info")
    print("5. Start Django: python3 manage.py runserver")
    print("\n📖 See README.md for detailed instructions")

if __name__ == "__main__":
    main()
