
import csv
import os
from datetime import datetime
from typing import List, Dict, Optional
import json

USER_ACTIVITIES_CSV = "data/user_activities.csv"
USER_APPLICATIONS_CSV = "data/user_applications.csv"

def init_activity_files():
    """Initialize activity tracking CSV files"""
    os.makedirs("data", exist_ok=True)
    
    if not os.path.exists(USER_ACTIVITIES_CSV):
        with open(USER_ACTIVITIES_CSV, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['id', 'user_id', 'activity_type', 'title', 'description', 'timestamp', 'metadata'])
    
    if not os.path.exists(USER_APPLICATIONS_CSV):
        with open(USER_APPLICATIONS_CSV, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['id', 'user_id', 'opportunity_id', 'opportunity_type', 'title', 'company', 'applied_date', 'status'])

def log_user_activity(user_id: str, activity_type: str, title: str, description: str, metadata: Dict = None):
    """Log user activity"""
    try:
        with open(USER_ACTIVITIES_CSV, 'a', newline='') as file:
            writer = csv.writer(file)
            activity_id = f"{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            writer.writerow([
                activity_id,
                user_id,
                activity_type,
                title,
                description,
                datetime.now().isoformat(),
                json.dumps(metadata or {})
            ])
    except Exception as e:
        print(f"Error logging activity: {e}")

def log_user_application(user_id: str, opportunity_id: str, opportunity_type: str, title: str, company: str):
    """Log user job/hackathon application"""
    try:
        with open(USER_APPLICATIONS_CSV, 'a', newline='') as file:
            writer = csv.writer(file)
            app_id = f"app_{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            writer.writerow([
                app_id,
                user_id,
                opportunity_id,
                opportunity_type,
                title,
                company,
                datetime.now().isoformat(),
                'applied'
            ])
    except Exception as e:
        print(f"Error logging application: {e}")

def get_user_activities(user_id: str, limit: int = 10) -> List[Dict]:
    """Get user's recent activities"""
    activities = []
    try:
        if os.path.exists(USER_ACTIVITIES_CSV):
            with open(USER_ACTIVITIES_CSV, 'r') as file:
                reader = csv.DictReader(file)
                user_activities = [row for row in reader if row['user_id'] == user_id]
                
                # Sort by timestamp descending
                user_activities.sort(key=lambda x: x['timestamp'], reverse=True)
                
                for activity in user_activities[:limit]:
                    activities.append({
                        'id': activity['id'],
                        'type': activity['activity_type'],
                        'title': activity['title'],
                        'description': activity['description'],
                        'timestamp': activity['timestamp'],
                        'metadata': json.loads(activity['metadata']) if activity['metadata'] else {}
                    })
                    
    except Exception as e:
        print(f"Error fetching user activities: {e}")
    
    return activities

def get_user_applications(user_id: str) -> List[Dict]:
    """Get user's applications"""
    applications = []
    try:
        if os.path.exists(USER_APPLICATIONS_CSV):
            with open(USER_APPLICATIONS_CSV, 'r') as file:
                reader = csv.DictReader(file)
                user_apps = [row for row in reader if row['user_id'] == user_id]
                
                for app in user_apps:
                    applications.append({
                        'id': app['id'],
                        'opportunity_id': app['opportunity_id'],
                        'opportunity_type': app['opportunity_type'],
                        'title': app['title'],
                        'company': app['company'],
                        'applied_date': app['applied_date'],
                        'status': app['status']
                    })
                    
    except Exception as e:
        print(f"Error fetching user applications: {e}")
    
    return applications

# Initialize files on module import
init_activity_files()
