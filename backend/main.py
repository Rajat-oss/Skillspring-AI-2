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
from user_activity import log_user_activity, get_user_activities, get_user_applications
from free_resources_service import FreeResourcesService
from gmail_service import GmailApplicationTracker
import database

# Set YouTube API key
os.environ['YOUTUBE_API_KEY'] = 'AIzaSyDhnxlM0aLBH5Jz8XLclT033F7HqakIADk'

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
ai_service = AIService()
activity_tracker = UserActivityTracker()
gmail_tracker = GmailApplicationTracker()

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

# Learning folder and path models
class LearningFolder(BaseModel):
    name: str
    description: Optional[str] = ""
    color: Optional[str] = "blue"

class LearningPathItem(BaseModel):
    title: str
    description: str
    completed: bool = False
    resources: List[str] = []
    estimated_hours: Optional[int] = 1

class GeneratedLearningPath(BaseModel):
    title: str
    description: str
    items: List[LearningPathItem]
    estimated_total_hours: int
    difficulty: str
    skills: List[str]

class AddToPathRequest(BaseModel):
    folder_id: str
    generated_path: GeneratedLearningPath

# Initialize learning folders CSV
LEARNING_FOLDERS_CSV = "data/learning_folders.csv"
LEARNING_PATH_ITEMS_CSV = "data/learning_path_items.csv"

def init_learning_folders():
    if not os.path.exists(LEARNING_FOLDERS_CSV):
        with open(LEARNING_FOLDERS_CSV, 'w', newline='') as<edit_file>
<path>backend/main.py</path>
<content>
<<<<<<< SEARCH
# Learning endpoints
@app.get("/learning/folders")
async def get_learning_folders(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    folders_data = read_csv_data(LEARNING_FOLDERS_CSV)
    user_folders = [folder for folder in folders_data if folder['user_id'] == current_user.id]

    folders_with_items = []
    for folder in user_folders:
        items_data = read_csv_data(LEARNING_PATH_ITEMS_CSV)
        folder_items = [item for item in items_data if item['folder_id'] == folder['id']]

        # Calculate progress
        total_items = len(folder_items)
        completed_items = len([item for item in folder_items if item['completed'] == 'True'])
        progress = (completed_items / total_items * 100) if total_items > 0 else 0

        folders_with_items.append({
            "id": folder['id'],
            "name": folder['name'],
            "description": folder['description'],
            "color": folder['color'],
            "progress": int(progress),
            "total_items": total_items,
            "completed_items": completed_items,
            "created_at": folder['created_at']
        })

    return {"folders": folders_with_items}
=======
# Learning endpoints
@app.get("/learning/folders")
async def get_learning_folders(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    folders_data = read_csv_data(LEARNING_FOLDERS_CSV)
    user_folders = [folder for folder in folders_data if folder['user_id'] == current_user.id]

    folders_with_items = []
    for folder in user_folders:
        items_data = read_csv_data(LEARNING_PATH_ITEMS_CSV)
        folder_items = [item for item in items_data if item['folder_id'] == folder['id']]

        # Calculate progress
        total_items = len(folder_items)
        completed_items = len([item for item in folder_items if item['completed'] == 'True'])
        progress = (completed_items / total_items * 100) if total_items > 0 else 0

        folders_with_items.append({
            "id": folder['id'],
            "name": folder['name'],
            "description": folder['description'],
            "color": folder['color'],
            "progress": int(progress),
            "total_items": total_items,
            "completed_items": completed_items,
            "created_at": folder['created_at']
        })

    return {"folders": folders_with_items}

# New endpoint: GET /opportunities/live
@app.get("/opportunities/live")
async def get_live_opportunities(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    from job_scraper import opportunity_cache

    cached_data = opportunity_cache.get("live_opportunities")
    if cached_data:
        return cached_data
    else:
        return {"jobs": [], "internships": [], "hackathons": [], "last_updated": None}

# New endpoint: GET /jobs/recommendations
@app.get("/jobs/recommendations")
async def get_job_recommendations(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    # For demo, return top 5 jobs from database or mock data
    try:
        jobs = database.get_user_job_recommendations(current_user.id)
        if not jobs:
            # Return mock data if no recommendations
            jobs = [
                {
                    "id": "1",
                    "title": "Frontend Developer",
                    "company": "TechCorp Inc.",
                    "location": "Remote",
                    "salary": "$70,000 - $90,000",
                    "skills": ["React", "TypeScript", "CSS"],
                    "platform": "LinkedIn"
                },
                {
                    "id": "2",
                    "title": "Full-Stack Engineer",
                    "company": "StartupXYZ",
                    "location": "San Francisco, CA",
                    "salary": "$80,000 - $120,000",
                    "skills": ["React", "Node.js", "MongoDB"],
                    "platform": "AngelList"
                }
            ]
        return {"recommendations": jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch job recommendations")

# New endpoint: GET /student/dashboard/stats
@app.get("/student/dashboard/stats")
async def get_student_dashboard_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # For demo, return mock stats
        stats = {
            "totalApplications": 42,
            "pendingInterviews": 5,
            "offersReceived": 3,
            "rejections": 10,
            "lastUpdated": datetime.utcnow().isoformat()
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard stats")

# Learning endpoints
@app.get("/learning/folders")
async def get_learning_folders(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    folders_data = read_csv_data(LEARNING_FOLDERS_CSV)
    user_folders = [folder for folder in folders_data if folder['user_id'] == current_user.id]

    folders_with_items = []
    for folder in user_folders:
        items_data = read_csv_data(LEARNING_PATH_ITEMS_CSV)
        folder_items = [item for item in items_data if item['folder_id'] == folder['id']]

        # Calculate progress
        total_items = len(folder_items)
        completed_items = len([item for item in folder_items if item['completed'] == 'True'])
        progress = (completed_items / total_items * 100) if total_items > 0 else 0

        folders_with_items.append({
            "id": folder['id'],
            "name": folder['name'],
            "description": folder['description'],
            "color": folder['color'],
            "progress": int(progress),
            "total_items": total_items,
            "completed_items": completed_items,
            "created_at": folder['created_at']
        })

    return {"folders": folders_with_items}

@app.post("/learning/folders")
async def create_learning_folder(
    folder: LearningFolder,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    folder_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()

    folders_data = read_csv_data(LEARNING_FOLDERS_CSV)
    folders_data.append({
        'id': folder_id,
        'user_id': current_user.id,
        'name': folder.name,
        'description': folder.description,
        'color': folder.color,
        'created_at': created_at
    })

    write_csv_data(LEARNING_FOLDERS_CSV, folders_data, 
                  ['id', 'user_id', 'name', 'description', 'color', 'created_at'])

    return {"folder_id": folder_id, "message": "Folder created successfully"}

@app.get("/learning/folders/{folder_id}/items")
async def get_folder_items(
    folder_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    items_data = read_csv_data(LEARNING_PATH_ITEMS_CSV)
    folder_items = [item for item in items_data if item['folder_id'] == folder_id and item['user_id'] == current_user.id]

    # Sort by order_index
    folder_items.sort(key=lambda x: int(x.get('order_index', 0)))

    formatted_items = []
    for item in folder_items:
        formatted_items.append({
            "id": item['id'],
            "title": item['title'],
            "description": item['description'],
            "completed": item['completed'] == 'True',
            "resources": item['resources'].split(',') if item['resources'] else [],
            "estimated_hours": int(item['estimated_hours']) if item['estimated_hours'] else 1,
            "order_index": int(item.get('order_index', 0))
        })

    return {"items": formatted_items}

@app.post("/learning/folders/{folder_id}/items/{item_id}/toggle")
async def toggle_item_completion(
    folder_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    items_data = read_csv_data(LEARNING_PATH_ITEMS_CSV)

    for item in items_data:
        if item['id'] == item_id and item['user_id'] == current_user.id:
            item['completed'] = 'False' if item['completed'] == 'True' else 'True'
            break

    write_csv_data(LEARNING_PATH_ITEMS_CSV, items_data,
                  ['id', 'folder_id', 'user_id', 'title', 'description', 'completed', 
                   'resources', 'estimated_hours', 'order_index', 'created_at'])

    return {"message": "Item completion toggled"}

@app.post("/ai/generate-learning-path")
async def generate_learning_path(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    goal = request.get('goal', '')
    skill_level = request.get('skill_level', 'beginner')
    time_commitment = request.get('time_commitment', '10')

    try:
        ai_service = AIService()

        # Create a detailed prompt for learning path generation
        prompt = f"""Generate a comprehensive learning path for: {goal}

        User details:
        - Skill level: {skill_level}
        - Available time per week: {time_commitment} hours
        - Profession: {current_user.profession}

        Create a structured roadmap with:
        1. Clear milestones/topics to learn
        2. Estimated hours for each topic
        3. Practical exercises or projects
        4. Resource recommendations

        Format as a JSON structure with title, description, items (each with title, description, estimated_hours), total_hours, difficulty, and skills array."""

        # Generate the learning path using AI
        ai_response = await ai_service.generate_ai_chat_response(prompt, {
            "role": current_user.role,
            "profession": current_user.profession
        })

        # Parse AI response and create structured path
        # For demo, return a structured example
        generated_path = {
            "title": f"{goal} Mastery Path",
            "description": f"Complete roadmap to master {goal} from {skill_level} level",
            "items": [
                {
                    "title": f"Fundamentals of {goal}",
                    "description": "Learn the core concepts and terminology",
                    "completed": False,
                    "resources": [],
                    "estimated_hours": 8
                },
                {
                    "title": "Hands-on Practice",
                    "description": "Build practical projects to apply knowledge",
                    "completed": False,
                    "resources": [],
                    "estimated_hours": 12
                },
                {
                    "title": "Advanced Topics",
                    "description": "Deep dive into complex concepts",
                    "completed": False,
                    "resources": [],
                    "estimated_hours": 15
                },
                {
                    "title": "Portfolio Project",
                    "description": "Create a showcase project",
                    "completed": False,
                    "resources": [],
                    "estimated_hours": 20
                }
            ],
            "estimated_total_hours": 55,
            "difficulty": "intermediate",
            "skills": goal.split() + ["problem-solving", "project-management"]
        }

        return {"generated_path": generated_path, "ai_explanation": ai_response}

    except Exception as e:
        print(f"Error generating learning path: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate learning path")

@app.post("/learning/add-generated-path")
async def add_generated_path_to_folder(
    request: AddToPathRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    items_data = read_csv_data(LEARNING_PATH_ITEMS_CSV)

    # Get current max order_index for the folder
    folder_items = [item for item in items_data if item['folder_id'] == request.folder_id]
    max_order = max([int(item.get('order_index', 0)) for item in folder_items]) if folder_items else 0

    # Add each item from the generated path
    for i, item in enumerate(request.generated_path.items):
        item_id = str(uuid.uuid4())
        items_data.append({
            'id': item_id,
            'folder_id': request.folder_id,
            'user_id': current_user.id,
            'title':item.title,
            'description': item.description,
'completed': 'False',
            'resources': ','.join(item.resources),
            'estimated_hours': str(item.estimated_hours),
            'order_index': str(max_order + i + 1),
            'created_at': datetime.utcnow().isoformat()
        })

    write_csv_data(LEARNING_PATH_ITEMS_CSV, items_data,
                  ['id', 'folder_id', 'user_id', 'title', 'description', 'completed', 
                   'resources', 'estimated_hours', 'order_index', 'created_at'])

    return {"message": "Learning path added successfully", "items_added": len(request.generated_path.items)}

@app.get("/learning/paths")
async def get_learning_paths(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    # Get learning paths from database
    try:
        learning_paths = database.get_user_learning_paths(current_user.id)

        # If no paths exist, create some default ones
        if not learning_paths:
            default_paths = [
                {
                    "id": "1",
                    "title": "Full-Stack Web Development",
                    "description": "Master React, Node.js, and modern web technologies",
                    "estimatedTime": "12 weeks",
                    "difficulty": "Intermediate",
                    "skills": ["React", "Node.js", "MongoDB", "TypeScript"]
                },
                {
                    "id": "2", 
                    "title": "Data Science Fundamentals",
                    "description": "Learn Python, statistics, and machine learning basics",
                    "estimatedTime": "16 weeks",
                    "difficulty": "Beginner",
                    "skills": ["Python", "Pandas", "NumPy", "Scikit-learn"]
                }
            ]

            for path in default_paths:
                database.add_learning_path(current_user.id, path)

            learning_paths = database.get_user_learning_paths(current_user.id)

        return {"paths": learning_paths}
    except Exception as e:
        # Fallback to mock data if database fails
        learning_paths = [
            {
                "id": "1",
                "title": "Full-Stack Web Development",
                "description": "Master React, Node.js, and modern web technologies",
                "progress": 45,
                "estimatedTime": "12 weeks",
                "difficulty": "Intermediate",
                "skills": ["React", "Node.js", "MongoDB", "TypeScript"],
                "status": "in_progress",
                "lastAccessed": "2024-01-20T10:30:00Z"
            }
        ]
        return {"paths": learning_paths}

@app.post("/learning/paths")
async def create_learning_path(
    path_data: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # Add path to database
        database.add_learning_path(current_user.id, path_data)

        # Log activity
        database.log_activity(
            current_user.id,
            'learning_path_created',
            'New Learning Path Created',
            f"Created learning path: {path_data['title']}"
        )

        return {"message": "Learning path created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create learning path")

@app.get("/learning/folders")
async def get_learning_folders(current_user: User = Depends(get_current_user)):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    folders_data = read_csv_data(LEARNING_FOLDERS_CSV)
    user_folders = [folder for folder in folders_data if folder['user_id'] == current_user.id]

    folders_with_items = []
    for folder in user_folders:
        items_data = read_csv_data(LEARNING_PATH_ITEMS_CSV)
        folder_items = [item for item in items_data if item['folder_id'] == folder['id']]

        # Calculate progress
        total_items = len(folder_items)
        completed_items = len([item for item in folder_items if item['completed'] == 'True'])
        progress = (completed_items / total_items * 100) if total_items > 0 else 0

        folders_with_items.append({
            "id": folder['id'],
            "name": folder['name'],
            "description": folder['description'],
            "color": folder['color'],
            "progress": int(progress),
            "total_items": total_items,
            "completed_items": completed_items,
            "created_at": folder['created_at']
        })

    return {"folders": folders_with_items}

@app.post("/learning/folders")
async def create_learning_folder(
    folder: LearningFolder,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    folder_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()

    folders_data = read_csv_data(LEARNING_FOLDERS_CSV)
    folders_data.append({
        'id': folder_id,
        'user_id': current_user.id,
        'name': folder.name,
        'description': folder.description,
        'color': folder.color,
        'created_at': created_at
    })

    write_csv_data(LEARNING_FOLDERS_CSV, folders_data, 
                  ['id', 'user_id', 'name', 'description', 'color', 'created_at'])

    return {"folder_id": folder_id, "message": "Folder created successfully"}

@app.get("/learning/folders/{folder_id}/items")
async def get_folder_items(
    folder_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    items_data = read_csv_data(LEARNING_PATH_ITEMS_CSV)
    folder_items = [item for item in items_data if item['folder_id'] == folder_id and item['user_id'] == current_user.id]

    # Sort by order_index
    folder_items.sort(key=lambda x: int(x.get('order_index', 0)))

    formatted_items = []
    for item in folder_items:
        formatted_items.append({
            "id": item['id'],
            "title": item['title'],
            "description": item['description'],
            "completed": item['completed'] == 'True',
            "resources": item['resources'].split(',') if item['resources'] else [],
            "estimated_hours": int(item['estimated_hours']) if item['estimated_hours'] else 1,
            "order_index": int(item.get('order_index', 0))
        })

    return {"items": formatted_items}

@app.post("/learning/folders/{folder_id}/items/{item_id}/toggle")
async def toggle_item_completion(
    folder_id: str,
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    items_data = read_csv_data(LEARNING_PATH_ITEMS_CSV)

    for item in items_data:
        if item['id'] == item_id and item['user_id'] == current_user.id:
            item['completed'] = 'False' if item['completed'] == 'True' else 'True'
            break

    write_csv_data(LEARNING_PATH_ITEMS_CSV, items_data,
                  ['id', 'folder_id', 'user_id', 'title', 'description', 'completed', 
                   'resources', 'estimated_hours', 'order_index', 'created_at'])

    return {"message": "Item completion toggled"}

@app.post("/ai/generate-learning-path")
async def generate_learning_path(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    goal = request.get('goal', '')
    skill_level = request.get('skill_level', 'beginner')
    time_commitment = request.get('time_commitment', '10')

    try:
        ai_service = AIService()

        # Create a detailed prompt for learning path generation
        prompt = f"""Generate a comprehensive learning path for: {goal}

        User details:
        - Skill level: {skill_level}
        - Available time per week: {time_commitment} hours
        - Profession: {current_user.profession}

        Create a structured roadmap with:
        1. Clear milestones/topics to learn
        2. Estimated hours for each topic
        3. Practical exercises or projects
        4. Resource recommendations

        Format as a JSON structure with title, description, items (each with title, description, estimated_hours), total_hours, difficulty, and skills array."""

        # Generate the learning path using AI
        ai_response = await ai_service.generate_ai_chat_response(prompt, {
            "role": current_user.role,
            "profession": current_user.profession
        })

        # Parse AI response and create structured path
        # For demo, return a structured example
        generated_path = {
            "title": f"{goal} Mastery Path",
            "description": f"Complete roadmap to master {goal} from {skill_level} level",
            "items": [
                {
                    "title": f"Fundamentals of {goal}",
                    "description": "Learn the core concepts and terminology",
                    "completed": False,
                    "resources": [],
                    "estimated_hours": 8
                },
                {
                    "title": "Hands-on Practice",
                    "description": "Build practical projects to apply knowledge",
                    "completed": False,
                    "resources": [],
                    "estimated_hours": 12
                },
                {
                    "title": "Advanced Topics",
                    "description": "Deep dive into complex concepts",
                    "completed": False,
                    "resources": [],
                    "estimated_hours": 15
                },
                {
                    "title": "Portfolio Project",
                    "description": "Create a showcase project",
                    "completed": False,
                    "resources": [],
                    "estimated_hours": 20
                }
            ],
            "estimated_total_hours": 55,
            "difficulty": "intermediate",
            "skills": goal.split() + ["problem-solving", "project-management"]
        }

        return {"generated_path": generated_path, "ai_explanation": ai_response}

    except Exception as e:
        print(f"Error generating learning path: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate learning path")

@app.post("/learning/add-generated-path")
async def add_generated_path_to_folder(
    request: AddToPathRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "individual":
        raise HTTPException(status_code=403, detail="Access denied")

    items_data = read_csv_data(LEARNING_PATH_ITEMS_CSV)

    # Get current max order_index for the folder
    folder_items = [item for item in items_data if item['folder_id'] == request.folder_id]
    max_order = max([int(item.get('order_index', 0)) for item in folder_items]) if folder_items else 0

    # Add each item from the generated path
    for i, item in enumerate(request.generated_path.items):
        item_id = str(uuid.uuid4())
        items_data.append({
            'id': item_id,
            'folder_id': request.folder_id,
            'user_id': current_user.id,
            'title':item.title,
            'description': item.description,
            'completed': 'False',
            'resources': ','.join(item.resources),
            'estimated_hours': str(item.estimated_hours),
            'order_index': str(max_order + i + 1),
            'created_at': datetime.utcnow().isoformat()
        })

    write_csv_data(LEARNING_PATH_ITEMS_CSV, items_data,
                  ['id', 'folder_id', 'user_id', 'title', 'description', 'completed', 
                   'resources', 'estimated_hours', 'order_index', 'created_at'])

    return {"message": "Learning path added successfully", "items_added": len(request.generated_path.items)}

# This code imports the database module and adds functionality for creating learning paths.