
import os
from typing import List, Dict, Optional
import asyncio
import google.generativeai as genai

class AIService:
    def __init__(self):
        # Configure Gemini AI
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
            print("Warning: GEMINI_API_KEY not found, using mock responses")

    async def generate_ai_chat_response(self, message: str, user_context: Dict = None) -> str:
        """Generate real-time AI chat response using Gemini"""
        if not self.model:
            return self._get_fallback_response(message)
        
        try:
            # Create a comprehensive context for the AI
            context = f"""You are an AI Career Assistant for SkillSpring Launchpad, helping students and professionals with their career development. 

User Context:
- Role: {user_context.get('role', 'individual')}
- Profession: {user_context.get('profession', 'General')}
- Email: {user_context.get('email', 'Unknown')}

Your capabilities include:
- Career guidance and path recommendations
- Skill assessment and learning suggestions
- Job market analysis and salary insights
- Resume optimization and interview prep
- Learning path recommendations
- Real-time market trends

Be helpful, encouraging, and provide actionable advice. Use emojis appropriately and format responses clearly with bullet points when needed.

User Message: {message}"""

            response = await asyncio.to_thread(
                self.model.generate_content, 
                context
            )
            
            return response.text
            
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return self._get_fallback_response(message)

    def _get_fallback_response(self, message: str) -> str:
        """Fallback responses when AI is unavailable"""
        query = message.lower()
        
        if any(word in query for word in ['career', 'job', 'future', 'path']):
            return """🎯 **Career Guidance**

I'm here to help with your career journey! Here are some key areas I can assist with:

**Career Development:**
• Identify growth opportunities in your field
• Suggest career transition paths
• Analyze market demand for your skills

**Job Search Strategy:**
• Find relevant job opportunities
• Optimize your resume for ATS systems
• Prepare for interviews

**Skill Development:**
• Recommend learning paths
• Identify skill gaps
• Suggest certifications

What specific career aspect would you like to explore? 🚀"""

        elif any(word in query for word in ['skill', 'learn', 'course', 'study']):
            return """📚 **Learning & Skill Development**

**Popular Learning Paths:**
• Full-Stack Development (React, Node.js, Databases)
• Data Science & Analytics
• Cloud Computing (AWS, Azure, GCP)
• AI/Machine Learning
• Cybersecurity

**Learning Strategy Tips:**
• Set clear, measurable goals
• Practice with real projects
• Join coding communities
• Build a portfolio

**Skill Assessment:**
• Take online assessments
• Get feedback from peers
• Track progress regularly

What skills are you interested in developing? 💡"""

        else:
            return """👋 **AI Career Assistant**

I'm here to help you succeed in your career! I can assist with:

🎯 **Career Planning** - Path recommendations, goal setting
📚 **Learning Guidance** - Course suggestions, skill development
💼 **Job Search** - Resume tips, interview prep, job matching
📊 **Market Insights** - Salary data, industry trends
🚀 **Growth Strategies** - Networking, personal branding

Just ask me anything about your career development, and I'll provide personalized guidance!

*Example questions:*
• "What skills should I learn for data science?"
• "How can I transition to a tech role?"
• "What's the job market like for developers?"

How can I help you today? 😊"""

    @staticmethod
    async def generate_career_insights(email: str, profession: str) -> List[str]:
        """Generate AI-powered career insights for individuals"""
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-pro')
                
                prompt = f"""Generate 4 specific, actionable career insights for a {profession} professional. 
                Focus on current market trends, skill development, and growth opportunities. 
                Make them concise and practical."""
                
                response = await asyncio.to_thread(model.generate_content, prompt)
                insights = response.text.split('\n')
                return [insight.strip('• -').strip() for insight in insights if insight.strip()][:4]
            
        except Exception as e:
            print(f"Error generating career insights: {e}")
        
        # Fallback insights
        return [
            f"Based on current market trends in {profession}, consider upskilling in emerging technologies",
            "Your profile shows strong potential for leadership roles - consider developing management skills",
            "Market demand for your skills is growing by 15% annually",
            "Consider exploring remote opportunities to expand your job market"
        ]

    @staticmethod
    async def generate_startup_insights(email: str, industry: str) -> List[str]:
        """Generate AI-powered startup insights"""
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-pro')
                
                prompt = f"""Generate 4 specific insights for a startup in the {industry} industry. 
                Focus on hiring strategies, market trends, and growth opportunities."""
                
                response = await asyncio.to_thread(model.generate_content, prompt)
                insights = response.text.split('\n')
                return [insight.strip('• -').strip() for insight in insights if insight.strip()][:4]
            
        except Exception as e:
            print(f"Error generating startup insights: {e}")
        
        return [
            f"The {industry} market is showing strong growth potential",
            "Consider implementing AI-driven hiring processes to improve candidate matching",
            "Focus on building a strong company culture to attract top talent",
            "Market conditions favor startups with strong technical teams"
        ]

    def search_courses(self, query: str) -> List[Dict]:
        """Search for relevant courses"""
        courses = [
            {
                "title": f"Advanced {query}",
                "provider": "TechEd",
                "duration": "8 weeks",
                "rating": 4.8,
                "price": "$299"
            },
            {
                "title": f"{query} Fundamentals",
                "provider": "SkillUp",
                "duration": "6 weeks", 
                "rating": 4.6,
                "price": "$199"
            }
        ]
        return courses

    def generate_project_ideas(self, query: str) -> List[str]:
        """Generate project ideas"""
        ideas = [
            f"Build a {query} web application with modern frameworks",
            f"Create a mobile app focused on {query}",
            f"Develop an API service for {query}",
            f"Design a dashboard for {query} analytics"
        ]
        return ideas

    def assess_skills(self, skills: str) -> Dict:
        """Assess skills and provide feedback"""
        return {
            "overall_score": 75,
            "strengths": skills.split(", ")[:2],
            "improvement_areas": ["System Design", "Leadership"],
            "recommendations": ["Take advanced courses", "Build portfolio projects"]
        }

    def analyze_job_market(self, role: str) -> Dict:
        """Analyze job market for a role"""
        return {
            "demand": "High",
            "salary_range": "$70k - $120k",
            "growth_rate": "15%",
            "top_skills": ["Python", "React", "AWS"],
            "market_insights": f"Strong demand for {role} positions"
        }

    def optimize_resume(self, resume: str) -> List[str]:
        """Provide resume optimization suggestions"""
        return [
            "Add more quantifiable achievements",
            "Include relevant keywords for ATS",
            "Highlight technical skills prominently",
            "Add a professional summary section"
        ]

    def prepare_interview(self, query: str) -> Dict:
        """Provide interview preparation guide"""
        return {
            "common_questions": [
                "Tell me about yourself",
                "What are your strengths?",
                "Describe a challenging project"
            ],
            "technical_topics": ["System Design", "Algorithms", "Frameworks"],
            "tips": ["Practice coding problems", "Prepare STAR method examples"]
        }

    def match_talent(self, requirements: str) -> List[Dict]:
        """Match talent based on requirements"""
        matches = [
            {
                "name": "Sarah Chen",
                "match_score": 95,
                "skills": ["React", "Node.js", "Python"],
                "experience": "5 years",
                "location": "Remote"
            },
            {
                "name": "Alex Rodriguez", 
                "match_score": 88,
                "skills": ["JavaScript", "AWS", "Docker"],
                "experience": "4 years",
                "location": "San Francisco"
            }
        ]
        return matches

    def generate_business_model(self, business_idea: str) -> Dict:
        """Generate business model suggestions"""
        return {
            "revenue_streams": ["Subscription", "Freemium", "Enterprise"],
            "key_partners": ["Technology providers", "Content creators"],
            "value_proposition": "Streamlined solution for modern businesses",
            "target_segments": ["SMBs", "Enterprise", "Freelancers"]
        }

    def analyze_market(self, industry: str) -> Dict:
        """Analyze market conditions"""
        return {
            "market_size": "$2.5B",
            "growth_rate": "12% annually",
            "key_trends": ["AI adoption", "Remote work", "Digital transformation"],
            "opportunities": ["Emerging markets", "New technologies"],
            "challenges": ["Competition", "Regulatory changes"]
        }
