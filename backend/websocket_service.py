import socketio
import asyncio
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # In production, specify your frontend URL
    logger=True,
    engineio_logger=True
)

# Create an ASGI application
socket_app = socketio.ASGIApp(sio)

# Store active connections
connected_users: Dict[str, Dict[str, Any]] = {}
active_rooms: Dict[str, Dict[str, Any]] = {}

# Real-time notifications queue
notifications_queue: Dict[str, List[Dict[str, Any]]] = {}

# Job and candidate updates
job_updates: List[Dict[str, Any]] = []
candidate_updates: List[Dict[str, Any]] = []

# Market insights updates
market_insights: Dict[str, Any] = {
    "last_updated": datetime.now().isoformat(),
    "data": {}
}





@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {sid}")
    
    # Clean up user data
    if sid in connected_users:
        # Leave all rooms
        for room in connected_users[sid].get("rooms", []):
            await sio.leave_room(sid, room)
            
        # Remove user from connected users
        del connected_users[sid]


@sio.event
async def authenticate(sid, data):
    """Authenticate user and join appropriate rooms"""
    try:
        user_id = data.get("user_id")
        role = data.get("role")
        token = data.get("token")
        
        if not user_id or not role or not token:
            await sio.emit('auth_error', {"error": "Missing authentication data"}, to=sid)
            return
        
        # In a real implementation, verify the token here
        # For now, we'll trust the provided data
        
        # Update user information
        connected_users[sid] = {
            "authenticated": True,
            "user_id": user_id,
            "role": role,
            "rooms": []
        }
        
        # Join role-specific room
        role_room = f"role_{role}"
        await sio.enter_room(sid, role_room)
        connected_users[sid]["rooms"].append(role_room)
        
        # Join user-specific room
        user_room = f"user_{user_id}"
        await sio.enter_room(sid, user_room)
        connected_users[sid]["rooms"].append(user_room)
        
        # Send authentication success
        await sio.emit('auth_success', {
            "status": "authenticated",
            "user_id": user_id,
            "role": role
        }, to=sid)
        
        # Send any pending notifications
        if user_id in notifications_queue:
            for notification in notifications_queue[user_id]:
                await sio.emit('notification', notification, to=user_room)
            
            # Clear the queue
            notifications_queue[user_id] = []
        
        # Send initial data based on role
        if role == "individual":
            # Send job updates
            await sio.emit('job_updates', {"updates": job_updates[-10:]}, to=sid)
            
            # Send market insights
            await sio.emit('market_insights', market_insights, to=sid)
            
        elif role == "startup":
            # Send candidate updates
            await sio.emit('candidate_updates', {"updates": candidate_updates[-10:]}, to=sid)
            
            # Send market insights
            await sio.emit('market_insights', market_insights, to=sid)
        
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        await sio.emit('auth_error', {"error": str(e)}, to=sid)


@sio.event
async def join_room(sid, data):
    """Join a specific room"""
    if sid not in connected_users or not connected_users[sid]["authenticated"]:
        await sio.emit('error', {"error": "Not authenticated"}, to=sid)
        return
    
    room = data.get("room")
    if not room:
        await sio.emit('error', {"error": "Room name is required"}, to=sid)
        return
    
    await sio.enter_room(sid, room)
    connected_users[sid]["rooms"].append(room)
    
    # Track room activity
    if room not in active_rooms:
        active_rooms[room] = {
            "created_at": datetime.now().isoformat(),
            "members": 0
        }
    
    active_rooms[room]["members"] += 1
    
    await sio.emit('room_joined', {"room": room}, to=sid)


@sio.event
async def leave_room(sid, data):
    """Leave a specific room"""
    if sid not in connected_users:
        return
    
    room = data.get("room")
    if not room:
        await sio.emit('error', {"error": "Room name is required"}, to=sid)
        return
    
    await sio.leave_room(sid, room)
    
    if room in connected_users[sid]["rooms"]:
        connected_users[sid]["rooms"].remove(room)
    
    # Update room tracking
    if room in active_rooms:
        active_rooms[room]["members"] -= 1
        if active_rooms[room]["members"] <= 0:
            del active_rooms[room]
    
    await sio.emit('room_left', {"room": room}, to=sid)


@sio.event
async def send_message(sid, data):
    """Send a message to a room or user"""
    if sid not in connected_users or not connected_users[sid]["authenticated"]:
        await sio.emit('error', {"error": "Not authenticated"}, to=sid)
        return
    
    room = data.get("room")
    recipient_id = data.get("recipient_id")
    message = data.get("message")
    
    if not message:
        await sio.emit('error', {"error": "Message is required"}, to=sid)
        return
    
    sender_id = connected_users[sid]["user_id"]
    sender_role = connected_users[sid]["role"]
    
    message_data = {
        "sender_id": sender_id,
        "sender_role": sender_role,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    if room:
        # Send to a room
        await sio.emit('new_message', message_data, room=room)
        await sio.emit('message_sent', {"status": "sent", "to": room}, to=sid)
    elif recipient_id:
        # Send to a specific user
        recipient_room = f"user_{recipient_id}"
        await sio.emit('new_message', message_data, room=recipient_room)
        await sio.emit('message_sent', {"status": "sent", "to": recipient_id}, to=sid)
    else:
        await sio.emit('error', {"error": "Either room or recipient_id is required"}, to=sid)


# Function to send notifications to users
async def send_notification(user_id: str, notification_type: str, data: Dict[str, Any]):
    """Send a notification to a specific user"""
    notification = {
        "type": notification_type,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }
    
    user_room = f"user_{user_id}"
    
    # Check if any connections exist for this user
    user_connected = False
    for sid, user_data in connected_users.items():
        if user_data.get("user_id") == user_id and user_data.get("authenticated"):
            user_connected = True
            await sio.emit('notification', notification, room=user_room)
    
    # If user is not connected, queue the notification
    if not user_connected:
        if user_id not in notifications_queue:
            notifications_queue[user_id] = []
        
        notifications_queue[user_id].append(notification)


# Function to broadcast job updates
async def broadcast_job_update(job_data: Dict[str, Any]):
    """Broadcast job update to all individual users"""
    job_update = {
        "job": job_data,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add to job updates history
    job_updates.append(job_update)
    if len(job_updates) > 100:  # Keep only the last 100 updates
        job_updates.pop(0)
    
    # Broadcast to all individual users
    await sio.emit('job_update', job_update, room="role_individual")


# Function to broadcast candidate updates
async def broadcast_candidate_update(candidate_data: Dict[str, Any]):
    """Broadcast candidate update to all startup users"""
    candidate_update = {
        "candidate": candidate_data,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add to candidate updates history
    candidate_updates.append(candidate_update)
    if len(candidate_updates) > 100:  # Keep only the last 100 updates
        candidate_updates.pop(0)
    
    # Broadcast to all startup users
    await sio.emit('candidate_update', candidate_update, room="role_startup")


# Function to update market insights
async def update_market_insights(insights_data: Dict[str, Any]):
    """Update market insights and broadcast to all users"""
    global market_insights
    
    market_insights = {
        "last_updated": datetime.now().isoformat(),
        "data": insights_data
    }
    
    # Broadcast to all authenticated users
    await sio.emit('market_insights_update', market_insights, room="role_individual")
    await sio.emit('market_insights_update', market_insights, room="role_startup")


# Background task to simulate real-time updates
async def background_updates():
    """Background task to simulate real-time updates"""
    while True:
        try:
            # Wait for a random interval between 30-60 seconds
            await asyncio.sleep(30)
            
            # Simulate market insights update
            current_time = datetime.now().isoformat()
            
            # Simple mock data - in a real app, this would come from your AI service
            mock_insights = {
                "trending_skills": ["React", "Python", "Machine Learning", "AWS"],
                "job_growth_sectors": ["Healthcare Tech", "Fintech", "AI/ML", "Cybersecurity"],
                "remote_work_trends": {
                    "remote_percentage": 42,
                    "hybrid_percentage": 38,
                    "onsite_percentage": 20
                },
                "salary_trends": {
                    "software_engineer": {"avg": "$105,000", "change": "+3.5%"},
                    "data_scientist": {"avg": "$120,000", "change": "+5.2%"},
                    "product_manager": {"avg": "$115,000", "change": "+2.8%"}
                },
                "generated_at": current_time
            }
            
            await update_market_insights(mock_insights)
            logger.info(f"Market insights updated at {current_time}")
            
        except Exception as e:
            logger.error(f"Error in background task: {str(e)}")
            await asyncio.sleep(10)  # Sleep briefly before retrying


# Start background task
async def initialize_background_tasks():
    """Initialize background tasks"""
    if not hasattr(initialize_background_tasks, 'started'):
        initialize_background_tasks.started = True
        sio.start_background_task(background_updates)

@sio.event
async def connect(sid, environ, auth):
    """Handle client connection"""
    logger.info(f"Client connected: {sid}")
    
    # Initialize background tasks on first connection
    await initialize_background_tasks()
    
    # Store connection without user info until authenticated
    connected_users[sid] = {
        "authenticated": False,
        "user_id": None,
        "role": None,
        "rooms": []
    }
    
    await sio.emit('connection_success', {"status": "connected", "sid": sid}, to=sid)


@sio.event
async def leave_room(sid, data):
    """Leave a specific room"""
    if sid not in connected_users:
        return
    
    room = data.get("room")
    if not room:
        await sio.emit('error', {"error": "Room name is required"}, to=sid)
        return
    
    await sio.leave_room(sid, room)
    
    if room in connected_users[sid]["rooms"]:
        connected_users[sid]["rooms"].remove(room)
    
    # Update room tracking
    if room in active_rooms:
        active_rooms[room]["members"] -= 1
        if active_rooms[room]["members"] <= 0:
            del active_rooms[room]
    
    await sio.emit('room_left', {"room": room}, to=sid)


@sio.event
async def send_message(sid, data):
    """Send a message to a room or user"""
    if sid not in connected_users or not connected_users[sid]["authenticated"]:
        await sio.emit('error', {"error": "Not authenticated"}, to=sid)
        return
    
    room = data.get("room")
    recipient_id = data.get("recipient_id")
    message = data.get("message")
    
    if not message:
        await sio.emit('error', {"error": "Message is required"}, to=sid)
        return
    
    sender_id = connected_users[sid]["user_id"]
    sender_role = connected_users[sid]["role"]
    
    message_data = {
        "sender_id": sender_id,
        "sender_role": sender_role,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    if room:
        # Send to a room
        await sio.emit('new_message', message_data, room=room)
        await sio.emit('message_sent', {"status": "sent", "to": room}, to=sid)
    elif recipient_id:
        # Send to a specific user
        recipient_room = f"user_{recipient_id}"
        await sio.emit('new_message', message_data, room=recipient_room)
        await sio.emit('message_sent', {"status": "sent", "to": recipient_id}, to=sid)
    else:
        await sio.emit('error', {"error": "Either room or recipient_id is required"}, to=sid)


# Function to send notifications to users
async def send_notification(user_id: str, notification_type: str, data: Dict[str, Any]):
    """Send a notification to a specific user"""
    notification = {
        "type": notification_type,
        "data": data,
        "timestamp": datetime.now().isoformat()
    }
    
    user_room = f"user_{user_id}"
    
    # Check if any connections exist for this user
    user_connected = False
    for sid, user_data in connected_users.items():
        if user_data.get("user_id") == user_id and user_data.get("authenticated"):
            user_connected = True
            await sio.emit('notification', notification, room=user_room)
    
    # If user is not connected, queue the notification
    if not user_connected:
        if user_id not in notifications_queue:
            notifications_queue[user_id] = []
        
        notifications_queue[user_id].append(notification)


# Function to broadcast job updates
async def broadcast_job_update(job_data: Dict[str, Any]):
    """Broadcast job update to all individual users"""
    job_update = {
        "job": job_data,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add to job updates history
    job_updates.append(job_update)
    if len(job_updates) > 100:  # Keep only the last 100 updates
        job_updates.pop(0)
    
    # Broadcast to all individual users
    await sio.emit('job_update', job_update, room="role_individual")


# Function to broadcast candidate updates
async def broadcast_candidate_update(candidate_data: Dict[str, Any]):
    """Broadcast candidate update to all startup users"""
    candidate_update = {
        "candidate": candidate_data,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add to candidate updates history
    candidate_updates.append(candidate_update)
    if len(candidate_updates) > 100:  # Keep only the last 100 updates
        candidate_updates.pop(0)
    
    # Broadcast to all startup users
    await sio.emit('candidate_update', candidate_update, room="role_startup")


# Function to update market insights
async def update_market_insights(insights_data: Dict[str, Any]):
    """Update market insights and broadcast to all users"""
    global market_insights
    
    market_insights = {
        "last_updated": datetime.now().isoformat(),
        "data": insights_data
    }
    
    # Broadcast to all authenticated users
    await sio.emit('market_insights_update', market_insights, room="role_individual")
    await sio.emit('market_insights_update', market_insights, room="role_startup")


# Background task to simulate real-time updates
async def background_updates():
    """Background task to simulate real-time updates"""
    while True:
        try:
            # Wait for a random interval between 30-60 seconds
            await asyncio.sleep(30)
            
            # Simulate market insights update
            current_time = datetime.now().isoformat()
            
            # Simple mock data - in a real app, this would come from your AI service
            mock_insights = {
                "trending_skills": ["React", "Python", "Machine Learning", "AWS"],
                "job_growth_sectors": ["Healthcare Tech", "Fintech", "AI/ML", "Cybersecurity"],
                "remote_work_trends": {
                    "remote_percentage": 42,
                    "hybrid_percentage": 38,
                    "onsite_percentage": 20
                },
                "salary_trends": {
                    "software_engineer": {"avg": "$105,000", "change": "+3.5%"},
                    "data_scientist": {"avg": "$120,000", "change": "+5.2%"},
                    "product_manager": {"avg": "$115,000", "change": "+2.8%"}
                },
                "generated_at": current_time
            }
            
            await update_market_insights(mock_insights)
            logger.info(f"Market insights updated at {current_time}")
            
        except Exception as e:
            logger.error(f"Error in background task: {str(e)}")
            await asyncio.sleep(10)  # Sleep briefly before retrying


import socketio
from fastapi import FastAPI
import asyncio
from typing import Dict, Any

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    logger=True,
    engineio_logger=True
)

# Create Socket.IO ASGI app
socket_app = socketio.ASGIApp(sio, other_asgi_app=None)

# Store connected clients
connected_clients = {}

@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")
    connected_clients[sid] = {
        "connected_at": asyncio.get_event_loop().time(),
        "user_id": None
    }

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")
    if sid in connected_clients:
        del connected_clients[sid]

@sio.event
async def join_user_room(sid, data):
    """Join a user-specific room for notifications"""
    user_id = data.get("user_id")
    if user_id:
        await sio.enter_room(sid, f"user_{user_id}")
        connected_clients[sid]["user_id"] = user_id
        print(f"Client {sid} joined room user_{user_id}")

@sio.event
async def leave_user_room(sid, data):
    """Leave a user-specific room"""
    user_id = data.get("user_id")
    if user_id:
        await sio.leave_room(sid, f"user_{user_id}")
        print(f"Client {sid} left room user_{user_id}")

# Utility functions for sending notifications
async def send_notification(user_id: str, notification_type: str, data: Dict[Any, Any]):
    """Send notification to a specific user"""
    try:
        await sio.emit("notification", {
            "type": notification_type,
            "data": data
        }, room=f"user_{user_id}")
        print(f"Sent notification to user {user_id}: {notification_type}")
    except Exception as e:
        print(f"Error sending notification: {e}")

async def broadcast_job_update(job_data: Dict[Any, Any]):
    """Broadcast job updates to all startup users"""
    try:
        await sio.emit("job_update", job_data, room="startups")
        print(f"Broadcasted job update: {job_data.get('title', 'Unknown')}")
    except Exception as e:
        print(f"Error broadcasting job update: {e}")

async def broadcast_candidate_update(candidate_data: Dict[Any, Any]):
    """Broadcast candidate updates to all startup users"""
    try:
        await sio.emit("candidate_update", candidate_data, room="startups")
        print(f"Broadcasted candidate update: {candidate_data.get('name', 'Unknown')}")
    except Exception as e:
        print(f"Error broadcasting candidate update: {e}")

async def update_market_insights(insights_data: Dict[Any, Any]):
    """Send market insights updates"""
    try:
        await sio.emit("market_insights", insights_data, room="startups")
        print(f"Sent market insights update")
    except Exception as e:
        print(f"Error sending market insights: {e}")

# Background task to send periodic updates
async def send_periodic_updates():
    """Send periodic market updates and insights"""
    while True:
        try:
            # Send market insights every 30 minutes
            await asyncio.sleep(1800)  # 30 minutes
            await update_market_insights({
                "type": "market_update",
                "message": "Market trends updated",
                "timestamp": asyncio.get_event_loop().time()
            })
        except Exception as e:
            print(f"Error in periodic updates: {e}")

# Start periodic updates task when server starts
# This will be handled by the background task starter
