
import sqlite3
import json
from datetime import datetime
import os

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'data', 'skillspring.db')

def init_database():
    """Initialize the database with required tables"""
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'individual',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Learning paths table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS learning_paths (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            progress INTEGER DEFAULT 0,
            estimated_time TEXT,
            difficulty TEXT,
            skills TEXT,
            status TEXT DEFAULT 'not_started',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_accessed TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Job applications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS job_applications (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            company_name TEXT NOT NULL,
            position TEXT NOT NULL,
            application_date DATE,
            status TEXT DEFAULT 'applied',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Activity logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Live opportunities table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS live_opportunities (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT,
            type TEXT NOT NULL,
            description TEXT,
            url TEXT,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def get_user_learning_paths(user_id: str):
    """Get all learning paths for a user"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM learning_paths WHERE user_id = ? ORDER BY created_at DESC
    ''', (user_id,))
    
    paths = []
    for row in cursor.fetchall():
        path = {
            'id': row[0],
            'title': row[2],
            'description': row[3],
            'progress': row[4],
            'estimatedTime': row[5],
            'difficulty': row[6],
            'skills': json.loads(row[7]) if row[7] else [],
            'status': row[8],
            'lastAccessed': row[10]
        }
        paths.append(path)
    
    conn.close()
    return paths

def add_learning_path(user_id: str, path_data: dict):
    """Add a new learning path for a user"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO learning_paths 
        (id, user_id, title, description, estimated_time, difficulty, skills, last_accessed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        path_data['id'],
        user_id,
        path_data['title'],
        path_data['description'],
        path_data.get('estimatedTime', '8-12 weeks'),
        path_data.get('difficulty', 'Beginner'),
        json.dumps(path_data.get('skills', [])),
        datetime.now().isoformat()
    ))
    
    conn.commit()
    conn.close()

def update_learning_path_progress(user_id: str, path_id: str, progress: int):
    """Update progress for a learning path"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    status = 'completed' if progress >= 100 else 'in_progress' if progress > 0 else 'not_started'
    
    cursor.execute('''
        UPDATE learning_paths 
        SET progress = ?, status = ?, last_accessed = ?
        WHERE id = ? AND user_id = ?
    ''', (progress, status, datetime.now().isoformat(), path_id, user_id))
    
    conn.commit()
    conn.close()

def log_activity(user_id: str, activity_type: str, title: str, description: str):
    """Log user activity"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO activity_logs (id, user_id, type, title, description)
        VALUES (?, ?, ?, ?, ?)
    ''', (str(int(datetime.now().timestamp())), user_id, activity_type, title, description))
    
    conn.commit()
    conn.close()

def get_user_activities(user_id: str, limit: int = 10):
    """Get recent activities for a user"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM activity_logs WHERE user_id = ? 
        ORDER BY timestamp DESC LIMIT ?
    ''', (user_id, limit))
    
    activities = []
    for row in cursor.fetchall():
        activity = {
            'id': row[0],
            'type': row[2],
            'title': row[3],
            'description': row[4],
            'timestamp': row[5]
        }
        activities.append(activity)
    
    conn.close()
    return activities

# Initialize database when module is imported
init_database()
