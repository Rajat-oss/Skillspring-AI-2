from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import csv
import os
import hashlib
import jwt
from datetime import datetime, timedelta
import uuid
import asyncio
from ai_service import AIService
from websocket_service import socket_app, send_notification, broadcast_job_update, broadcast_candidate_update, update_market_insights
from user_activity import log_user_activity, log_user_application, get_user_activities, get_user_applications
from free_resources_service import FreeResourcesService

app = FastAPI(title="SkillSpring Launchpad API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the Socket.IO app
app.mount("/ws", socket_app)

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-here"  # Change this in production
ALGORITHM = "HS256"

# CSV file paths
USERS_CSV = "data/users.csv"
LEARNING_PATHS_CSV = "data/learning_paths.csv"
JOBS_CSV = "data/jobs.csv"
CANDIDATES_CSV = "data/candidates.csv"

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# Initialize CSV files if they don't exist
def init_csv_files():
    if not os.path.exists(USERS_CSV):
        with open(USERS_CSV, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['id', 'email', 'password_hash', 'role', 'profession', 'created_at'])

    if not os.path.exists(LEARNING_PATHS_CSV):
        with open(LEARNING_PATHS_CSV, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['id', 'title', 'description', 'progress', 'estimated_time', 'difficulty', 'skills'])
            # Add sample data
            sample_paths = [
                ['1', 'Full-Stack Web Development', 'Master React, Node.js, and modern web technologies', '35', '12 weeks', 'Intermediate', 'React,Node.js,MongoDB,TypeScript'],
                ['2', 'Data Science Fundamentals', 'Learn Python, statistics, and machine learning basics', '0', '16 weeks', 'Beginner', 'Python,Pandas,Scikit-learn,Statistics'],
                ['3', 'AI/ML Engineering', 'Deep dive into artificial intelligence and machine learning', '15', '20 weeks', 'Advanced', 'Python,TensorFlow,PyTorch,Deep Learning'],
            ]
            writer.writerows(sample_paths)

    if not os.path.exists(JOBS_CSV):
        with open(JOBS_CSV, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['id', 'title', 'company', 'location', 'salary', 'match', 'skills', 'platform'])
            # Add sample data
            sample_jobs = [
                ['1', 'Frontend Developer', 'TechCorp Inc.', 'Remote', '$70,000 - $90,000', '92', 'React,TypeScript,CSS', 'LinkedIn'],
                ['2', 'Full-Stack Engineer', 'StartupXYZ', 'San Francisco, CA', '$80,000 - $120,000', '87', 'React,Node.js,MongoDB', 'AngelList'],
                ['3', 'Data Scientist', 'DataCorp', 'New York, NY', '$90,000 - $130,000', '85', 'Python,Machine Learning,SQL', 'Indeed'],
            ]
            writer.writerows(sample_jobs)

    if not os.path.exists(CANDIDATES_CSV):
        with open(CANDIDATES_CSV, 'w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(['id', 'name', 'title', 'skills', 'experience', 'location', 'match', 'status'])
            # Add sample data
            sample_candidates = [
                ['1', 'Sarah Chen', 'Full-Stack Developer', 'React,Node.js,Python,AWS', '3 years', 'San Francisco, CA', '95', 'available'],
                ['2', 'Alex Rodriguez', 'UI/UX Designer', 'Figma,Adobe Creative Suite,Prototyping', '4 years', 'Remote', '88', 'interviewing'],
                ['3', 'Michael Kim', 'Data Scientist', 'Python,Machine Learning,SQL,TensorFlow', '5 years', 'New York, NY', '92', 'available'],
                ['4', 'Emily Johnson', 'DevOps Engineer', 'AWS,Docker,Kubernetes,CI/CD', '6 years', 'Austin, TX', '89', 'available'],
            ]
            writer.writerows(sample_candidates)

init_csv_files()

# Initialize services
free_resources_service = FreeResourcesService()

# Start background tasks
@app.on_event("startup")
async def startup_event():
    # Assuming task_manager is defined and initialized elsewhere (e.g., in ai_service.py)
    from ai_service import task_manager  
    await task_manager.start()

@app.on_event("shutdown") 
async def shutdown_event():
    # Assuming task_manager is defined and initialized elsewhere (e.g., in ai_service.py)
    from ai_service import task_manager
    await task_manager.stop()

# Pydantic models
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    role: str
    profession: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    role: str
    profession: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")

        # Get user from CSV
        with open(USERS_CSV, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if row['email'] == email:
                    return User(
                        id=row['id'],
                        email=row['email'],
                        role=row['role'],
                        profession=row['profession'],
                        created_at=row['created_at']
                    )
        raise HTTPException(status_code=401, detail="User not found")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# CSV helper functions
def read_csv_data(file_path: str) -> List[dict]:
    data = []
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            reader = csv.DictReader(file)
            data = list(reader)
    return data

def write_csv_data(file_path: str, data: List[dict], fieldnames: List[str]):
    with open(file_path, 'w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

# Authentication endpoints
@app.post("/auth/signup", response_model=Token)
async def signup(user_data: UserSignup):
    # Check if user already exists
    users = read_csv_data(USERS_CSV)
    for user in users:
        if user['email'] == user_data.email:
            raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    created_at = datetime.utcnow().isoformat()

    new_user = {
        'id': user_id,
        'email': user_data.email,
        'password_hash': hashed_password,
        'role': user_data.role,
        'profession': user_data.profession,
        'created_at': created_at
    }

    users.append(new_user)
    write_csv_data(USERS_CSV, users, ['id', 'email', 'password_hash', 'role', 'profession', 'created_at'])

    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})

    user_response = User(
        id=user_id,
        email=user_data.email,
        role=user_data.role,
        profession=user_data.profession,
        created_at=created_at
    )

    # Send welcome notification via WebSocket
    asyncio.create_task(send_notification(
        user_id,
        "signup_success",
        {
            "message": f"Welcome to SkillSpring Launchpad! Your account was created at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
            "timestamp": datetime.utcnow().isoformat()
        }
    ))

    # Broadcast new user notification based on role
    if user_data.role == "individual":
        asyncio.create_task(broadcast_candidate_update({
            "id": user_id,
            "email": user_data.email,
            "profession": user_data.profession,
            "status": "new_user",
            "created_at": created_at
        }))
    elif user_data.role == "startup":
        # Update market insights with new startup
        asyncio.create_task(update_market_insights({
            "new_startup": {
                "id": user_id,
                "industry": user_data.profession,
                "joined_at": created_at
            },
            "timestamp": datetime.utcnow().isoformat()
        }))

    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    users = read_csv_data(USERS_CSV)

    for user in users:
        if user['email'] == user_data.email and verify_password(user_data.password, user['password_hash']):
            access_token = create_access_token(data={"sub": user_data.email})

            user_response = User(
                id=user['id'],
                email=user['email'],
                role=user['role'],
                profession=user['profession'],
                created_at=user['created_at']
            )

            # Send login notification via WebSocket
            asyncio.create_task(send_notification(
                user['id'],
                "login_success",
                {
                    "message": f"Welcome back! You logged in at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            ))

            return Token(access_token=access_token, token_type="bearer", user=user_response)

    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.get("/auth/verify")
async def verify_token(current_user: User = Depends(get_current_user)):
    return current_user

# File upload models
from fastapi import UploadFile, File

class ResumeAnalysisResponse(BaseModel):
    skills: List[str]
    experience_level: str
    career_suggestions: List[str]
    skill_gaps: List[str]
    learning_recommendations: List[str]
    ats_score: int

# AI endpoints
@app.post("/ai/resume-analysis", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # In a real implementation, you would:
        # 1. Parse the PDF content
        # 2. Extract text using libraries like PyPDF2 or pdfplumber
        # 3. Send to AI service for analysis
        # For now, we'll return mock analysis

        await asyncio.sleep(2)  # Simulate processing time

        # Mock analysis based on user's profession
        profession = current_user.profession.lower()

        if "developer" in profession or "engineer" in profession:
            analysis = ResumeAnalysisResponse(
                skills=["React", "JavaScript", "Node.js", "Python", "SQL", "AWS"],
                experience_level="Mid-level (3-5 years)",
                career_suggestions=[
                    "Full-Stack Developer",
                    "Frontend Developer", 
                    "Software Engineer",
                    "Cloud Developer"
                ],
                skill_gaps=["TypeScript", "Docker", "System Design", "Leadership"],
                learning_recommendations=[
                    "Advanced React Patterns",
                    "System Design Fundamentals", 
                    "AWS Certification",
                    "Leadership in Tech"
                ],
                ats_score=85
            )
        else:
            analysis = ResumeAnalysisResponse(
                skills=["Project Management", "Communication", "Analytics", "Strategy"],
                experience_level="Mid-level (3-5 years)",
                career_suggestions=[
                    "Product Manager",
                    "Business Analyst",
                    "Project Manager",
                    "Strategy Consultant"
                ],
                skill_gaps=["Data Analysis", "Agile Methodologies", "Technical Writing"],
                learning_recommendations=[
                    "Product Management Fundamentals",
                    "Data-Driven Decision Making",
                    "Agile and Scrum Certification"
                ],
                ats_score=78
            )

        return analysis

    except Exception as e:
        print(f"Error analyzing resume: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze resume")

@app.get("/ai/career-insights")
async def get_career_insights(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    insights = await AIService.generate_career_insights(current_user.email, current_user.profession)
    return {"insights": insights}

@app.get("/ai/startup-insights")
async def get_startup_insights(current_user: User = Depends(get_current_user)):
    if current_user.role != "startup":
        raise HTTPException(status_code=403, detail="Access denied")

    insights = await AIService.generate_startup_insights(current_user.email, current_user.profession)
    return {"insights": insights}

# LearnBuddyGPT endpoints
class CourseSearchRequest(BaseModel):
    query: str

@app.post("/ai/learn-buddy/course-search")
async def learn_buddy_course_search(
    request: CourseSearchRequest, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    ai_service = AIService()
    courses = ai_service.search_courses(request.query)
    return {"courses": courses}

class ProjectIdeasRequest(BaseModel):
    topic: str
    skill_level: Optional[str] = "intermediate"

@app.post("/ai/learn-buddy/project-ideas")
async def learn_buddy_project_ideas(
    request: ProjectIdeasRequest, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    ai_service = AIService()
    query = f"{request.topic} at {request.skill_level} level"
    project_ideas = ai_service.generate_project_ideas(query)
    return {"project_ideas": project_ideas}

class SkillAssessmentRequest(BaseModel):
    skills: List[str]

@app.post("/ai/learn-buddy/skill-assessment")
async def learn_buddy_skill_assessment(
    request: SkillAssessmentRequest, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    ai_service = AIService()
    assessment = ai_service.assess_skills(", ".join(request.skills))
    return {"assessment": assessment}

# CareerPathGPT endpoints
class JobMarketRequest(BaseModel):
    role: str

@app.post("/ai/career-path/job-market")
async def career_path_job_market(
    request: JobMarketRequest, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    ai_service = AIService()
    analysis = ai_service.analyze_job_market(request.role)
    return {"analysis": analysis}

class ResumeOptimizationRequest(BaseModel):
    resume: str
    target_role: Optional[str] = None

@app.post("/ai/career-path/resume-optimization")
async def career_path_resume_optimization(
    request: ResumeOptimizationRequest, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    ai_service = AIService()

    resume_with_context = request.resume
    if request.target_role:
        resume_with_context = f"Target Role: {request.target_role}\n\nResume:\n{request.resume}"

    suggestions = ai_service.optimize_resume(resume_with_context)
    return {"suggestions": suggestions}

class InterviewPrepRequest(BaseModel):
    role: str
    company: Optional[str] = None

@app.post("/ai/career-path/interview-prep")
async def career_path_interview_prep(
    request: InterviewPrepRequest, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    ai_service = AIService()

    query = request.role
    if request.company:
        query = f"{request.role} at {request.company}"

    prep_guide = ai_service.prepare_interview(query)
    return {"prep_guide": prep_guide}

# StartMateGPT endpoints
class TalentMatchRequest(BaseModel):
    job_requirements: str
    experience_level: Optional[str] = None
    location_preference: Optional[str] = None

@app.post("/ai/start-mate/talent-match")
async def start_mate_talent_match(
    request: TalentMatchRequest, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "startup":
        raise HTTPException(status_code=403, detail="Access denied")

    ai_service = AIService()

    requirements = request.job_requirements
    if request.experience_level:
        requirements += f"\nExperience Level: {request.experience_level}"
    if request.location_preference:
        requirements += f"\nLocation Preference: {request.location_preference}"

    matches = ai_service.match_talent(requirements)
    return {"matches": matches}

class BusinessModelRequest(BaseModel):
    business_idea: str
    industry: Optional[str] = None
    target_market: Optional[str] = None

@app.post("/ai/start-mate/business-model")
async def start_mate_business_model(
    request: BusinessModelRequest, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "startup":
        raise HTTPException(status_code=403, detail="Access denied")

    ai_service = AIService()

    business_idea = request.business_idea
    if request.industry:
        business_idea += f"\nIndustry: {request.industry}"
    if request.target_market:
        business_idea += f"\nTarget Market: {request.target_market}"

    business_model = ai_service.generate_business_model(business_idea)
    return {"business_model": business_model}

class MarketAnalysisRequest(BaseModel):
    industry: str
    target_market: Optional[str] = None
    competitors: Optional[List[str]] = None

@app.post("/ai/start-mate/market-analysis")
async def start_mate_market_analysis(
    request: MarketAnalysisRequest, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "startup":
        raise HTTPException(status_code=403, detail="Access denied")

    ai_service = AIService()

    industry = request.industry
    if request.target_market:
        industry += f" targeting {request.target_market}"
    if request.competitors and len(request.competitors) > 0:
        industry += f" with competitors like {', '.join(request.competitors)}"

    analysis = ai_service.analyze_market(industry)
    return {"analysis": analysis}

# Learning endpoints
@app.get("/learning/paths")
async def get_learning_paths(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    paths_data = read_csv_data(LEARNING_PATHS_CSV)

    # Convert to proper format
    paths = []
    for path in paths_data:
        paths.append({
            "id": path['id'],
            "title": path['title'],
            "description": path['description'],
            "progress": int(path['progress']),
            "estimatedTime": path['estimated_time'],
            "difficulty": path['difficulty'],
            "skills": path['skills'].split(',') if path['skills'] else []
        })

    return {"paths": paths}

# Job endpoints
@app.get("/jobs/recommendations")
async def get_job_recommendations(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    jobs_data = read_csv_data(JOBS_CSV)

    # Convert to proper format
    jobs = []
    for job in jobs_data:
        jobs.append({
            "id": job['id'],
            "title": job['title'],
            "company": job['company'],
            "location": job['location'],
            "salary": job['salary'],
            "match": int(job['match']),
            "skills": job['skills'].split(',') if job['skills'] else [],
            "platform": job['platform']
        })

    return {"jobs": jobs}

@app.get("/jobs/postings")
async def get_job_postings(current_user: User = Depends(get_current_user)):
    if current_user.role != "startup":
        raise HTTPException(status_code=403, detail="Access denied")

    # Mock job postings for startups
    jobs = [
        {
            "id": "1",
            "title": "Senior Frontend Developer",
            "department": "Engineering",
            "type": "Full-time",
            "applicants": 24,
            "status": "active",
            "postedDate": "2024-01-15"
        },
        {
            "id": "2",
            "title": "Product Designer",
            "department": "Design",
            "type": "Full-time",
            "applicants": 18,
            "status": "active",
            "postedDate": "2024-01-12"
        }
    ]

    return {"jobs": jobs}

# Candidate endpoints
@app.get("/candidates/discover")
async def discover_candidates(current_user: User = Depends(get_current_user)):
    if current_user.role != "startup":
        raise HTTPException(status_code=403, detail="Access denied")

    candidates_data = read_csv_data(CANDIDATES_CSV)

    # Convert to proper format
    candidates = []
    for candidate in candidates_data:
        candidates.append({
            "id": candidate['id'],
            "name": candidate['name'],
            "title": candidate['title'],
            "skills": candidate['skills'].split(',') if candidate['skills'] else [],
            "experience": candidate['experience'],
            "location": candidate['location'],
            "match": int(candidate['match']),
            "avatar": f"/placeholder.svg?height=48&width=48",
            "status": candidate['status']
        })

    return {"candidates": candidates}

# Student Activity Tracking
class ActivityLog(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    description: str
    timestamp: str

class LearningProgressUpdate(BaseModel):
    path_id: str
    new_progress: int

class JobApplication(BaseModel):
    job_id: str
    application_date: str

# Activity tracking endpoints
@app.post("/student/activity/log")
async def log_activity(
    activity: ActivityLog,
    current_user: User = Depends(get_current_user)
):
    """Log student activity for tracking and analytics"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    # In a real implementation, save to database
    # For now, return success
    return {"status": "logged", "activity_id": activity.id}

@app.post("/student/learning/update-progress")
async def update_learning_progress(
    progress_update: LearningProgressUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update learning path progress"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    # Simulate progress update
    return {
        "status": "updated",
        "path_id": progress_update.path_id,
        "new_progress": progress_update.new_progress,
        "updated_at": datetime.utcnow().isoformat()
    }

@app.post("/student/jobs/apply")
async def apply_to_job(
    application: JobApplication,
    current_user: User = Depends(get_current_user)
):
    """Apply to a job"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    # Simulate job application
    return {
        "status": "applied",
        "job_id": application.job_id,
        "application_id": str(uuid.uuid4()),
        "applied_at": datetime.utcnow().isoformat()
    }

@app.get("/student/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get student dashboard statistics"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    # Get real user data
    user_activities = get_user_activities(current_user.id, limit=100)
    user_applications = get_user_applications(current_user.id)
    
    # Calculate real statistics
    ai_interactions = len([a for a in user_activities if a['type'] == 'ai_interaction'])
    course_activities = [a for a in user_activities if a['type'] == 'course_completed']
    
    # Get learning paths progress
    paths_data = read_csv_data(LEARNING_PATHS_CSV)
    total_courses = len(paths_data)
    completed_courses = len([p for p in paths_data if int(p.get('progress', 0)) == 100])
    in_progress_courses = len([p for p in paths_data if 0 < int(p.get('progress', 0)) < 100])
    
    # Calculate average progress
    if paths_data:
        average_progress = sum(int(p.get('progress', 0)) for p in paths_data) // len(paths_data)
    else:
        average_progress = 0
    
    # Calculate career score based on activity
    base_score = 50
    progress_boost = min(average_progress // 2, 30)  # Up to 30 points for progress
    activity_boost = min(len(user_activities), 20)   # Up to 20 points for activity
    career_score = min(base_score + progress_boost + activity_boost, 100)

    return {
        "career_score": career_score,
        "total_courses": total_courses,
        "completed_courses": completed_courses,
        "in_progress_courses": in_progress_courses,
        "job_applications": len(user_applications),
        "ai_interactions": ai_interactions,
        "average_progress": average_progress,
        "streak_days": 7,  # This would need more complex calculation
        "certificates_earned": completed_courses
    }

@app.get("/student/applications/history")
async def get_application_history(current_user: User = Depends(get_current_user)):
    """Get user's application history"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    applications = get_user_applications(current_user.id)
    return {"applications": applications}

@app.get("/student/activity/recent")
async def get_recent_activity(current_user: User = Depends(get_current_user)):
    """Get user's recent activity"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    activities = get_user_activities(current_user.id, limit=20)
    return {"activities": activities}

@app.post("/student/opportunities/apply")
async def apply_to_opportunity(
    opportunity: dict,
    current_user: User = Depends(get_current_user)
):
    """Apply to a job, internship, or hackathon"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    # Log the application
    log_user_application(
        current_user.id,
        opportunity.get('id'),
        opportunity.get('type', 'job'),
        opportunity.get('title'),
        opportunity.get('company', 'Unknown')
    )
    
    # Log the activity
    log_user_activity(
        current_user.id,
        'application_submitted',
        f"Applied to {opportunity.get('title')}",
        f"Applied to {opportunity.get('title')} at {opportunity.get('company')}",
        opportunity
    )

    return {
        "status": "success",
        "message": "Application submitted successfully",
        "applied_at": datetime.utcnow().isoformat()
    }

@app.get("/student/recommendations/personalized")
async def get_personalized_recommendations(current_user: User = Depends(get_current_user)):
    """Get personalized learning and job recommendations"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    # Get user's application history and activities for personalization
    applications = get_user_applications(current_user.id)
    activities = get_user_activities(current_user.id, limit=50)
    
    # Analyze user's interests from applications
    applied_skills = set()
    applied_companies = set()
    for app in applications:
        if 'skills' in app.get('metadata', {}):
            applied_skills.update(app['metadata']['skills'])
        applied_companies.add(app.get('company', ''))

    # Enhanced recommendations based on user profile and activity
    recommendations = {
        "learning_paths": [
            {
                "id": "advanced-react",
                "title": "Advanced React Patterns",
                "reason": "Based on your recent activity and applications",
                "priority": "high",
                "estimated_completion": "3 weeks"
            },
            {
                "id": "typescript-fundamentals",
                "title": "TypeScript Fundamentals", 
                "reason": f"Required by {len(applied_companies)} companies you applied to",
                "priority": "medium",
                "estimated_completion": "2 weeks"
            }
        ],
        "jobs": [
            {
                "id": "frontend-dev-remote",
                "title": "Frontend Developer (Remote)",
                "company": "TechCorp",
                "match_reason": "Matches your application pattern",
                "salary": "$75,000 - $95,000",
                "urgency": "high"
            }
        ],
        "skills": list(applied_skills)[:5] if applied_skills else [
            {
                "name": "React",
                "demand": "high",
                "learning_time": "2 weeks",
                "salary_impact": "+20%"
            }
        ]
    }

    return recommendations

# Enhanced AI Chat endpoint
class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None

@app.post("/ai/chat/student-assistant")
async def student_ai_chat(
    chat: ChatMessage,
    current_user: User = Depends(get_current_user)
):
    """Real-time AI chat using Gemini for career assistance"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        ai_service = AIService()

        # Prepare user context for the AI
        user_context = {
            "role": current_user.role,
            "profession": current_user.profession,
            "email": current_user.email
        }

        # Get AI response using Gemini
        response = await ai_service.generate_ai_chat_response(chat.message, user_context)

        return {
            "response": response,
            "timestamp": datetime.utcnow().isoformat(),
            "suggestions": [
                "What skills should I learn next?",
                "How to prepare for interviews?", 
                "Find jobs matching my skills",
                "Analyze current job market",
                "Create a learning plan",
                "Help with resume optimization"
            ]
        }

    except Exception as e:
        print(f"Error in AI chat: {e}")
        raise HTTPException(status_code=500, detail="AI assistant temporarily unavailable")

# Free Resources endpoints
@app.get("/learning/free-resources")
async def get_free_resources(
    search: Optional[str] = None,
    category: Optional[str] = None,
    level: Optional[str] = None,
    language: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get free learning resources with optional filters"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")
    
    resources = free_resources_service.search_resources(
        query=search or "",
        category=category or "",
        level=level or "",
        language=language or ""
    )
    
    # Get user's bookmarks to add status
    user_bookmarks = free_resources_service.get_user_bookmarks(current_user.id)
    bookmark_dict = {b['id']: b for b in user_bookmarks}
    
    # Add bookmark status to resources
    for resource in resources:
        if resource['id'] in bookmark_dict:
            bookmark = bookmark_dict[resource['id']]
            resource['bookmark_status'] = bookmark['bookmark_status']
            resource['progress'] = bookmark['progress']
        else:
            resource['bookmark_status'] = None
            resource['progress'] = 0
    
    return {"resources": resources}

@app.get("/learning/free-resources/categories")
async def get_resource_categories(current_user: User = Depends(get_current_user)):
    """Get all available resource categories"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")
    
    categories = free_resources_service.get_categories()
    levels = free_resources_service.get_levels()
    languages = free_resources_service.get_languages()
    
    return {
        "categories": categories,
        "levels": levels,
        "languages": languages
    }

@app.get("/learning/free-resources/bookmarks")
async def get_user_bookmarks(current_user: User = Depends(get_current_user)):
    """Get user's bookmarked resources"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")
    
    bookmarks = free_resources_service.get_user_bookmarks(current_user.id)
    return {"bookmarks": bookmarks}

@app.post("/learning/free-resources/{resource_id}/bookmark")
async def bookmark_resource(
    resource_id: str,
    status: str = "bookmarked",
    current_user: User = Depends(get_current_user)
):
    """Bookmark a resource"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")
    
    valid_statuses = ["bookmarked", "in_progress", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = free_resources_service.bookmark_resource(current_user.id, resource_id, status)
    
    # Log activity
    log_user_activity(
        current_user.id,
        'resource_bookmarked',
        f'Resource {status}',
        f'Marked resource as {status}',
        {'resource_id': resource_id, 'status': status}
    )
    
    return result

@app.post("/learning/free-resources/{resource_id}/progress")
async def update_resource_progress(
    resource_id: str,
    progress: int,
    current_user: User = Depends(get_current_user)
):
    """Update learning progress for a resource"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not 0 <= progress <= 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
    
    result = free_resources_service.update_progress(current_user.id, resource_id, progress)
    
    # Log activity
    status_text = "completed" if progress >= 100 else "updated progress on"
    log_user_activity(
        current_user.id,
        'learning_progress',
        f'Learning progress {status_text}',
        f'Updated progress to {progress}% on resource',
        {'resource_id': resource_id, 'progress': progress}
    )
    
    return result

@app.get("/learning/free-resources/recommendations")
async def get_recommended_resources(current_user: User = Depends(get_current_user)):
    """Get AI-recommended free resources"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")
    
    user_profile = {
        'profession': current_user.profession,
        'email': current_user.email
    }
    
    recommendations = free_resources_service.get_recommended_resources(user_profile)
    
    # Get user's bookmarks to add status
    user_bookmarks = free_resources_service.get_user_bookmarks(current_user.id)
    bookmark_dict = {b['id']: b for b in user_bookmarks}
    
    # Add bookmark status to recommendations
    for resource in recommendations:
        if resource['id'] in bookmark_dict:
            bookmark = bookmark_dict[resource['id']]
            resource['bookmark_status'] = bookmark['bookmark_status']
            resource['progress'] = bookmark['progress']
        else:
            resource['bookmark_status'] = None
            resource['progress'] = 0
    
    return {"recommendations": recommendations}

@app.post("/admin/update-content")
async def manual_content_update(current_user: User = Depends(get_current_user)):
    """Manually trigger content update (admin only)"""
    # For demo purposes, allow any user to trigger update
    # In production, add admin role check
    
    try:
        from background_tasks import JobScraper
        scraper = JobScraper()
        
        # Update learning content
        count = await scraper.update_learning_content()
        
        return {
            "status": "success", 
            "message": f"Content updated successfully. Added {count} new resources.",
            "updated_count": count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update content: {str(e)}")

@app.get("/learning/free-resources/search")
async def search_resources_realtime(
    q: str,
    category: Optional[str] = None,
    level: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Real-time search with auto-suggestions"""
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Search existing resources
    resources = free_resources_service.search_resources(
        query=q,
        category=category or "",
        level=level or ""
    )
    
    # If we have few results and YouTube API is available, search YouTube
    if len(resources) < 5:
        try:
            from youtube_service import YouTubeService
            youtube_service = YouTubeService()
            
            # Determine category from query if not provided
            search_category = category or youtube_service.categorize_content(q)
            
            # Search YouTube for additional content
            youtube_results = youtube_service.search_educational_videos(
                query=q, 
                category=search_category, 
                max_results=10
            )
            
            # Add YouTube results to response
            for video in youtube_results:
                # Convert tags list to comma-separated string
                if isinstance(video.get('tags'), list):
                    video['tags'] = video['tags']
                else:
                    video['tags'] = video.get('tags', '').split(',') if video.get('tags') else []
                
                video['bookmark_status'] = None
                video['progress'] = 0
                
            resources.extend(youtube_results)
            
        except Exception as e:
            print(f"Error searching YouTube: {e}")
    
    return {
        "resources": resources[:20],  # Limit to 20 results
        "total": len(resources),
        "query": q,
        "suggestions": generate_search_suggestions(q)
    }

def generate_search_suggestions(query: str) -> List[str]:
    """Generate search suggestions based on query"""
    suggestions = []
    query_lower = query.lower()
    
    # Technology suggestions
    tech_suggestions = {
        'web': ['web development', 'web design', 'html css', 'javascript'],
        'react': ['react tutorial', 'react hooks', 'react native', 'react redux'],
        'python': ['python tutorial', 'python data science', 'python django', 'python flask'],
        'data': ['data science', 'data analysis', 'data visualization', 'machine learning'],
        'ai': ['artificial intelligence', 'machine learning', 'deep learning', 'neural networks'],
        'design': ['ui design', 'ux design', 'graphic design', 'figma tutorial'],
        'mobile': ['mobile development', 'android development', 'ios development', 'flutter']
    }
    
    for keyword, related in tech_suggestions.items():
        if keyword in query_lower:
            suggestions.extend(related)
    
    # Remove duplicates and current query
    suggestions = list(set(suggestions))
    if query.lower() in suggestions:
        suggestions.remove(query.lower())
    
    return suggestions[:8]

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)