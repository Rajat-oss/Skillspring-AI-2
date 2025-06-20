import socketio
from fastapi import FastAPI
import asyncio
from typing import Dict, Any

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    logger=True,
    engineio_logger=True
)

# Create Socket.IO ASGI app
socket_app = socketio.ASGIApp(sio, static_files={
    '/': {'content_type': 'text/html', 'filename': 'index.html'}
})

# Store active connections
connected_users = {}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    # Remove from connected users
    for user_id, user_sid in connected_users.items():
        if user_sid == sid:
            del connected_users[user_id]
            break

@sio.event
async def join_user_room(sid, data):
    """Join user to their personal room for notifications"""
    user_id = data.get('user_id')
    if user_id:
        connected_users[user_id] = sid
        await sio.enter_room(sid, f"user_{user_id}")
        print(f"User {user_id} joined their room")

@sio.event
async def join_startup_room(sid, data):
    """Join startup users to startup room for real-time updates"""
    user_id = data.get('user_id')
    if user_id:
        await sio.enter_room(sid, "startups")
        print(f"Startup user {user_id} joined startup room")

@sio.event
async def ai_chat_message(sid, data):
    """Handle real-time AI chat messages"""
    try:
        from ai_service import AIService
        
        message = data.get('message', '')
        user_context = data.get('user_context', {})
        
        ai_service = AIService()
        response = await ai_service.generate_ai_chat_response(message, user_context)
        
        # Send response back to the user
        await sio.emit('ai_chat_response', {
            'response': response,
            'timestamp': datetime.utcnow().isoformat()
        }, room=sid)
        
    except Exception as e:
        await sio.emit('ai_chat_error', {
            'error': 'AI assistant temporarily unavailable',
            'timestamp': datetime.utcnow().isoformat()
        }, room=sid)

async def send_notification(user_id: str, notification_type: str, data: Dict[str, Any]):
    """Send notification to specific user"""
    try:
        await sio.emit('notification', {
            'type': notification_type,
            'data': data
        }, room=f"user_{user_id}")
        print(f"Sent notification to user {user_id}: {notification_type}")
    except Exception as e:
        print(f"Error sending notification: {e}")

async def broadcast_job_update(job_data: Dict[str, Any]):
    """Broadcast job updates to all startup users"""
    try:
        await sio.emit('job_update', job_data, room="startups")
        print("Broadcasted job update to startups")
    except Exception as e:
        print(f"Error broadcasting job update: {e}")

async def broadcast_candidate_update(candidate_data: Dict[str, Any]):
    """Broadcast candidate updates to all startup users"""
    try:
        await sio.emit('candidate_update', candidate_data, room="startups")
        print("Broadcasted candidate update to startups")
    except Exception as e:
        print(f"Error broadcasting candidate update: {e}")

async def update_market_insights(insights_data: Dict[str, Any]):
    """Update market insights for all users"""
    try:
        await sio.emit('market_insights_update', insights_data)
        print("Updated market insights for all users")
    except Exception as e:
        print(f"Error updating market insights: {e}")