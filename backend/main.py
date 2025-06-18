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

# AI endpoints
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

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
