import os
import asyncio
import random
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

class AIService:
    def __init__(self):
        # For now, we'll use mock responses since external AI services require API keys
        self.mock_mode = True
    
    def setup_langchain(self):
        """Set up LangChain agents and tools"""
        self.llm = ChatOpenAI(temperature=0.7, model="gpt-4")
        
        # Define tools for LearnBuddyGPT
        self.learn_buddy_tools = [
            Tool(
                name="CourseSearch",
                func=self.search_courses,
                description="Search for online courses based on skills and topics"
            ),
            Tool(
                name="ProjectGenerator",
                func=self.generate_project_ideas,
                description="Generate project ideas based on skill level and interests"
            ),
            Tool(
                name="SkillAssessment",
                func=self.assess_skills,
                description="Assess current skill level and identify gaps"
            )
        ]
        
        # Define tools for CareerPathGPT
        self.career_path_tools = [
            Tool(
                name="JobMarketAnalysis",
                func=self.analyze_job_market,
                description="Analyze current job market trends for specific roles"
            ),
            Tool(
                name="ResumeOptimizer",
                func=self.optimize_resume,
                description="Provide suggestions to optimize resume for specific roles"
            ),
            Tool(
                name="InterviewPrep",
                func=self.prepare_interview,
                description="Generate interview preparation materials"
            )
        ]
        
        # Define tools for StartMateGPT
        self.start_mate_tools = [
            Tool(
                name="TalentMatcher",
                func=self.match_talent,
                description="Find and match talent based on job requirements"
            ),
            Tool(
                name="BusinessModelGenerator",
                func=self.generate_business_model,
                description="Generate business model canvas and strategies"
            ),
            Tool(
                name="MarketAnalysis",
                func=self.analyze_market,
                description="Analyze market conditions and competition"
            )
        ]
        
        # Create agent memories
        self.learn_buddy_memory = ConversationBufferMemory(memory_key="chat_history")
        self.career_path_memory = ConversationBufferMemory(memory_key="chat_history")
        self.start_mate_memory = ConversationBufferMemory(memory_key="chat_history")
    
    # Tool implementation methods
    def search_courses(self, query: str) -> str:
        """Search for online courses based on skills and topics"""
        try:
            prompt = f"""
            As an AI course curator, find the best online courses for learning {query}.
            For each course, provide:
            - Course title
            - Platform (Coursera, Udemy, etc.)
            - Instructor
            - Brief description
            - Skill level
            - Estimated completion time
            
            Return 3-5 high-quality courses in a structured format.
            """
            
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = self.gemini_model.generate_content(prompt)
                return response.text
        except Exception as e:
            print(f"Error searching courses: {e}")
            return "Error searching for courses. Please try again later."
    
    def generate_project_ideas(self, query: str) -> str:
        """Generate project ideas based on skill level and interests"""
        try:
            prompt = f"""
            Generate 3-5 project ideas for someone interested in {query}.
            For each project idea, provide:
            - Project title
            - Brief description
            - Key technologies/skills used
            - Difficulty level
            - Estimated time to complete
            - Learning outcomes
            
            Make the projects practical and portfolio-worthy.
            """
            
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = self.gemini_model.generate_content(prompt)
                return response.text
        except Exception as e:
            print(f"Error generating project ideas: {e}")
            return "Error generating project ideas. Please try again later."
    
    def assess_skills(self, skills: str) -> str:
        """Assess current skill level and identify gaps"""
        try:
            prompt = f"""
            Assess the following skills: {skills}
            
            Provide:
            1. Current market demand for each skill (High/Medium/Low)
            2. Complementary skills that would enhance the existing skillset
            3. Suggested learning path to advance to the next level
            4. Potential career paths leveraging these skills
            
            Format as a structured assessment report.
            """
            
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = self.gemini_model.generate_content(prompt)
                return response.text
        except Exception as e:
            print(f"Error assessing skills: {e}")
            return "Error assessing skills. Please try again later."
    
    def analyze_job_market(self, role: str) -> str:
        """Analyze current job market trends for specific roles"""
        try:
            prompt = f"""
            Analyze the current job market for {role} positions.
            
            Include:
            1. Average salary ranges by experience level
            2. Most in-demand skills for this role
            3. Top hiring companies/industries
            4. Growth projections for the next 1-3 years
            5. Remote work opportunities
            
            Format as a comprehensive market analysis report.
            """
            
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = self.gemini_model.generate_content(prompt)
                return response.text
        except Exception as e:
            print(f"Error analyzing job market: {e}")
            return "Error analyzing job market. Please try again later."
    
    def optimize_resume(self, resume: str) -> str:
        """Provide suggestions to optimize resume for specific roles"""
        try:
            prompt = f"""
            Review the following resume and provide optimization suggestions:
            
            {resume}
            
            Include:
            1. Content improvements (skills, experience descriptions)
            2. Formatting suggestions
            3. ATS optimization tips
            4. Keywords to include
            5. Sections to add or expand
            
            Format as actionable improvement suggestions.
            """
            
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = self.gemini_model.generate_content(prompt)
                return response.text
        except Exception as e:
            print(f"Error optimizing resume: {e}")
            return "Error optimizing resume. Please try again later."
    
    def prepare_interview(self, role: str) -> str:
        """Generate interview preparation materials"""
        try:
            prompt = f"""
            Create an interview preparation guide for a {role} position.
            
            Include:
            1. 10 common technical questions with sample answers
            2. 5 behavioral questions with response frameworks
            3. 3 questions to ask the interviewer
            4. Key skills to emphasize
            5. Research points about potential employers
            
            Format as a comprehensive interview preparation guide.
            """
            
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = self.gemini_model.generate_content(prompt)
                return response.text
        except Exception as e:
            print(f"Error preparing interview: {e}")
            return "Error preparing interview materials. Please try again later."
    
    def match_talent(self, requirements: str) -> str:
        """Find and match talent based on job requirements"""
        try:
            prompt = f"""
            Based on these job requirements:
            {requirements}
            
            Provide:
            1. Ideal candidate profile
            2. Must-have skills vs. nice-to-have skills
            3. Experience level recommendations
            4. Sourcing strategies for finding qualified candidates
            5. Screening questions to assess fit
            
            Format as a talent acquisition strategy.
            """
            
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = self.gemini_model.generate_content(prompt)
                return response.text
        except Exception as e:
            print(f"Error matching talent: {e}")
            return "Error matching talent. Please try again later."
    
    def generate_business_model(self, business_idea: str) -> str:
        """Generate business model canvas and strategies"""
        try:
            prompt = f"""
            Create a business model canvas for:
            {business_idea}
            
            Include:
            1. Value proposition
            2. Customer segments
            3. Revenue streams
            4. Cost structure
            5. Key activities, resources, and partners
            6. Customer relationships and channels
            7. Go-to-market strategy
            
            Format as a comprehensive business model analysis.
            """
            
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = self.gemini_model.generate_content(prompt)
                return response.text
        except Exception as e:
            print(f"Error generating business model: {e}")
            return "Error generating business model. Please try again later."
    
    def analyze_market(self, industry: str) -> str:
        """Analyze market conditions and competition"""
        try:
            prompt = f"""
            Provide a market analysis for the {industry} industry.
            
            Include:
            1. Market size and growth projections
            2. Key players and competitive landscape
            3. Current trends and innovations
            4. Challenges and opportunities
            5. Regulatory considerations
            6. Entry barriers and success factors
            
            Format as a comprehensive market analysis report.
            """
            
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = self.gemini_model.generate_content(prompt)
                return response.text
        except Exception as e:
            print(f"Error analyzing market: {e}")
            return "Error analyzing market. Please try again later."
    
    @staticmethod
    async def generate_career_insights(email: str, profession: str) -> str:
        """Generate AI-powered career insights for individuals"""
        try:
            ai_service = AIService()
            
            prompt = f"""
            As LearnBuddyGPT, an AI career mentor, provide personalized career insights for a {profession} professional.
            
            Consider current market trends, skill demands, and growth opportunities.
            Provide actionable advice in 2-3 paragraphs that is:
            - Specific to their profession
            - Based on current market trends
            - Actionable and motivating
            
            Focus on skills, opportunities, and next steps for career growth.
            """
            
            if ai_service.openai_client:
                response = ai_service.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = ai_service.gemini_model.generate_content(prompt)
                return response.text
            
        except Exception as e:
            print(f"Error generating career insights: {e}")
            # Fallback to predefined insights
            insights = [
                f"Based on current market trends, {profession} skills are in high demand with 23% growth this quarter. Consider expanding your expertise in emerging technologies to stay competitive. The most valuable skills in your field now include cloud architecture, AI integration, and cross-functional collaboration.\n\nTo accelerate your career growth, focus on building a portfolio that demonstrates real-world problem-solving. Participate in open-source projects and industry forums to increase visibility. Consider pursuing certifications in specialized areas that complement your existing skillset.",
                
                f"Your {profession} background positions you well for leadership roles in the evolving digital landscape. Focus on developing cross-functional skills and building a strong professional network. Companies are increasingly seeking professionals who can bridge technical expertise with business strategy.\n\nConsider joining industry associations and attending virtual conferences to expand your connections. Developing mentorship skills and team leadership experience will significantly enhance your career trajectory. Look for opportunities to lead small projects or initiatives within your current role.",
                
                f"The remote job market for {profession} professionals has expanded by 34% in the last 6 months. Consider highlighting your remote collaboration skills and digital workflow proficiency on your profile. Companies are prioritizing candidates who demonstrate strong communication and self-management abilities.\n\nInvest time in learning asynchronous communication tools and project management methodologies. Creating a personal brand through thought leadership content can significantly increase your visibility to potential employers. Consider starting a blog or contributing to industry publications.",
                
                f"AI and automation are transforming the {profession} field. Upskilling in AI-related technologies could increase your market value by 15-20%. Focus on understanding how AI tools can enhance your current workflow rather than replace it.\n\nConsider taking specialized courses in machine learning applications specific to your field. Employers are seeking professionals who can strategically implement AI solutions while maintaining human oversight and ethical considerations. Developing a hybrid skillset that combines technical knowledge with strategic thinking will position you as a valuable asset.",
            ]
            return random.choice(insights)
    
    @staticmethod
    async def generate_startup_insights(email: str, industry: str) -> str:
        """Generate AI-powered insights for startups"""
        try:
            ai_service = AIService()
            
            prompt = f"""
            As StartMateGPT, an AI business advisor, provide strategic insights for a {industry} startup.
            
            Consider market conditions, hiring trends, and growth strategies.
            Provide actionable business advice in 2-3 paragraphs that covers:
            - Market opportunities
            - Hiring strategies
            - Growth recommendations
            
            Be specific to the {industry} industry and current market conditions.
            """
            
            if ai_service.openai_client:
                response = ai_service.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:
                response = ai_service.gemini_model.generate_content(prompt)
                return response.text
            
        except Exception as e:
            print(f"Error generating startup insights: {e}")
            # Fallback to predefined insights
            insights = [
                f"Your {industry} startup can capitalize on the current market shift toward sustainable and ethical business practices. Consider highlighting your ESG initiatives in your marketing and investor pitches, as this could attract both customers and funding opportunities. The most successful companies in your space are focusing on creating measurable impact alongside profitability.\n\nFor talent acquisition, focus on candidates with 2-4 years of experience who bring fresh perspectives without the salary demands of senior executives. Consider expanding remote hiring to access 60% more qualified talent across different geographic regions. Implement a structured onboarding program that emphasizes your company culture and mission to improve retention rates.",
                
                f"Current market conditions in {industry} favor companies with flexible business models and diversified revenue streams. Consider developing subscription-based offerings alongside your core products to create predictable revenue. Investors are particularly interested in startups demonstrating clear unit economics and path to profitability.\n\nYour hiring timeline can be optimized by implementing AI-powered screening tools that reduce time-to-hire by up to 40%. Consider offering equity packages alongside competitive salaries to attract top talent without straining cash reserves. Focus on building a diverse team with complementary skills rather than hiring multiple specialists with overlapping expertise.",
                
                f"The {industry} market is experiencing rapid growth, with particular opportunities in underserved segments like small businesses and emerging markets. Consider developing targeted solutions for these segments to establish market leadership before larger competitors enter the space. Strategic partnerships with established companies can provide credibility and access to their customer base.\n\nFocus on building a strong technical team balanced with experienced business development professionals. Consider implementing a hybrid work model to attract talent from different geographic regions while maintaining company culture. Invest in robust knowledge management systems to ensure efficient onboarding and prevent knowledge silos as your team grows.",
                
                f"Based on industry analysis, {industry} startups benefit from early investment in AI and automation to streamline operations and enhance product capabilities. Consider implementing these technologies to gain competitive advantage and improve operational efficiency. The most successful companies in your space are using data-driven decision making to optimize their go-to-market strategies.\n\nAdopt a milestone-based hiring approach tied to specific growth metrics rather than following traditional departmental expansion. Consider implementing project-based collaborations with specialized freelancers for non-core functions. Develop a strong employer brand that emphasizes your mission and growth opportunities to attract mission-aligned talent.",
            ]
            return random.choice(insights)
    
    @staticmethod
    async def generate_learning_path(profession: str, goals: List[str]) -> Dict:
        """Generate personalized learning paths"""
        try:
            ai_service = AIService()
            
            prompt = f"""
            Create a personalized learning path for a {profession} professional.
            Goals: {', '.join(goals)}
            
            Provide a structured learning plan with:
            - Path title
            - Description
            - Estimated duration
            - Key skills to learn
            - Difficulty level
            - Weekly breakdown of activities
            - Recommended resources (courses, books, projects)
            
            Format as a structured JSON response with these fields.
            """
            
            if ai_service.openai_client:
                response = ai_service.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                content = response.choices[0].message.content
                
                # Try to parse JSON from the response
                try:
                    # Find JSON in the response if it's wrapped in text
                    import re
                    json_match = re.search(r'```json\n([\s\S]*?)\n```', content)
                    if json_match:
                        json_str = json_match.group(1)
                    else:
                        json_str = content
                    
                    data = json.loads(json_str)
                    return {
                        "title": data.get("title", f"Advanced {profession} Development"),
                        "description": data.get("description", "Comprehensive skill development program tailored to your career goals."),
                        "duration": data.get("duration", "12-16 weeks"),
                        "skills": data.get("skills", ["Advanced Programming", "System Design", "Leadership"]),
                        "difficulty": data.get("difficulty", "Intermediate"),
                        "weeklyBreakdown": data.get("weeklyBreakdown", []),
                        "resources": data.get("resources", [])
                    }
                except:
                    # If JSON parsing fails, extract information from text
                    return {
                        "title": f"Advanced {profession} Development",
                        "description": content[:200] + "...",
                        "duration": "12-16 weeks",
                        "skills": ["Advanced Programming", "System Design", "Leadership"],
                        "difficulty": "Intermediate"
                    }
            else:
                response = ai_service.gemini_model.generate_content(prompt)
                
                # Try to parse JSON from the response
                try:
                    # Find JSON in the response if it's wrapped in text
                    import re
                    json_match = re.search(r'```json\n([\s\S]*?)\n```', response.text)
                    if json_match:
                        json_str = json_match.group(1)
                    else:
                        json_str = response.text
                    
                    data = json.loads(json_str)
                    return {
                        "title": data.get("title", f"Advanced {profession} Development"),
                        "description": data.get("description", "Comprehensive skill development program tailored to your career goals."),
                        "duration": data.get("duration", "12-16 weeks"),
                        "skills": data.get("skills", ["Advanced Programming", "System Design", "Leadership"]),
                        "difficulty": data.get("difficulty", "Intermediate"),
                        "weeklyBreakdown": data.get("weeklyBreakdown", []),
                        "resources": data.get("resources", [])
                    }
                except:
                    # If JSON parsing fails, extract information from text
                    return {
                        "title": f"Advanced {profession} Development",
                        "description": response.text[:200] + "...",
                        "duration": "12-16 weeks",
                        "skills": ["Advanced Programming", "System Design", "Leadership"],
                        "difficulty": "Intermediate"
                    }
            
        except Exception as e:
            print(f"Error generating learning path: {e}")
            return {
                "title": f"Professional {profession} Development",
                "description": "Comprehensive skill development program tailored to your career goals.",
                "duration": "12 weeks",
                "skills": ["Core Skills", "Advanced Concepts", "Industry Best Practices"],
                "difficulty": "Intermediate"
            }
    
    @staticmethod
    async def scan_job_markets() -> List[Dict]:
        """Scan job markets for real-time opportunities"""
        try:
            ai_service = AIService()
            
            prompt = """
            Provide current job market analysis including:
            - Top platforms (LinkedIn, Indeed, AngelList)
            - Average salary ranges
            - In-demand skills
            - Market trends
            
            Format as structured JSON data for tech roles with these fields:
            - platform (string)
            - jobs (number)
            - avgSalary (string)
            - topSkills (array of strings)
            - trends (array of strings)
            """
            
            if ai_service.openai_client:
                response = ai_service.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                content = response.choices[0].message.content
                
                # Try to parse JSON from the response
                try:
                    # Find JSON in the response if it's wrapped in text
                    import re
                    json_match = re.search(r'```json\n([\s\S]*?)\n```', content)
                    if json_match:
                        json_str = json_match.group(1)
                    else:
                        json_str = content
                    
                    data = json.loads(json_str)
                    if isinstance(data, list):
                        return data
                    else:
                        # If it's not a list, try to extract the relevant field
                        return data.get("platforms", [])
                except:
                    # Fallback to predefined data
                    return [
                        {
                            "platform": "LinkedIn",
                            "jobs": 1250,
                            "avgSalary": "$85,000",
                            "topSkills": ["React", "Node.js", "Python", "AWS"],
                            "trends": ["Remote work flexibility", "AI integration", "Cross-functional roles"]
                        },
                        {
                            "platform": "Indeed", 
                            "jobs": 890,
                            "avgSalary": "$78,000",
                            "topSkills": ["JavaScript", "AWS", "Docker"],
                            "trends": ["Cloud expertise", "DevOps integration", "Agile methodologies"]
                        },
                        {
                            "platform": "AngelList",
                            "jobs": 340,
                            "avgSalary": "$95,000", 
                            "topSkills": ["React", "TypeScript", "GraphQL"],
                            "trends": ["Startup experience", "Full-stack capabilities", "Product-focused development"]
                        }
                    ]
            else:
                # Mock structured response based on AI insights
                return [
                    {
                        "platform": "LinkedIn",
                        "jobs": 1250,
                        "avgSalary": "$85,000",
                        "topSkills": ["React", "Node.js", "Python", "AWS"],
                        "trends": ["Remote work flexibility", "AI integration", "Cross-functional roles"]
                    },
                    {
                        "platform": "Indeed", 
                        "jobs": 890,
                        "avgSalary": "$78,000",
                        "topSkills": ["JavaScript", "AWS", "Docker"],
                        "trends": ["Cloud expertise", "DevOps integration", "Agile methodologies"]
                    },
                    {
                        "platform": "AngelList",
                        "jobs": 340,
                        "avgSalary": "$95,000", 
                        "topSkills": ["React", "TypeScript", "GraphQL"],
                        "trends": ["Startup experience", "Full-stack capabilities", "Product-focused development"]
                    }
                ]
            
        except Exception as e:
            print(f"Error scanning job markets: {e}")
            # Return fallback data
            return [
                {
                    "platform": "LinkedIn",
                    "jobs": 1200,
                    "avgSalary": "$85,000",
                    "topSkills": ["React", "Node.js", "Python"],
                    "trends": ["Remote work", "AI skills", "Cloud computing"]
                }
            ]
    
    @staticmethod
    async def match_candidates(requirements: List[str]) -> List[Dict]:
        """Match candidates based on job requirements"""
        try:
            ai_service = AIService()
            
            prompt = f"""
            Based on job requirements: {', '.join(requirements)}
            
            Analyze and rank candidates based on:
            - Skill match percentage
            - Experience relevance
            - Cultural fit indicators
            
            Provide candidate matching insights as structured JSON data with these fields:
            - name (string)
            - match (number)
            - skills (array of strings)
            - experience (string)
            - reasoning (string)
            - strengths (array of strings)
            - areas_for_growth (array of strings)
            """
            
            if ai_service.openai_client:
                response = ai_service.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": prompt}],
                    temperature=0.7
                )
                content = response.choices[0].message.content
                
                # Try to parse JSON from the response
                try:
                    # Find JSON in the response if it's wrapped in text
                    import re
                    json_match = re.search(r'```json\n([\s\S]*?)\n```', content)
                    if json_match:
                        json_str = json_match.group(1)
                    else:
                        json_str = content
                    
                    data = json.loads(json_str)
                    if isinstance(data, list):
                        return data
                    else:
                        # If it's not a list, try to extract the relevant field
                        return data.get("candidates", [])
                except:
                    # Fallback to predefined data
                    return [
                        {
                            "name": "Sarah Chen",
                            "match": 95,
                            "skills": ["React", "Node.js", "Python", "AWS"],
                            "experience": "3 years",
                            "reasoning": "Strong technical skills with relevant experience",
                            "strengths": ["Full-stack expertise", "Cloud deployment", "Agile methodologies"],
                            "areas_for_growth": ["Leadership experience", "System architecture"]
                        },
                        {
                            "name": "Alex Rodriguez", 
                            "match": 88,
                            "skills": ["Figma", "Adobe Creative Suite", "Prototyping"],
                            "experience": "4 years",
                            "reasoning": "Excellent design skills with proven track record",
                            "strengths": ["UI/UX expertise", "User research", "Design systems"],
                            "areas_for_growth": ["Frontend development", "Accessibility standards"]
                        }
                    ]
            else:
                # Return structured candidate data
                return [
                    {
                        "name": "Sarah Chen",
                        "match": 95,
                        "skills": ["React", "Node.js", "Python", "AWS"],
                        "experience": "3 years",
                        "reasoning": "Strong technical skills with relevant experience",
                        "strengths": ["Full-stack expertise", "Cloud deployment", "Agile methodologies"],
                        "areas_for_growth": ["Leadership experience", "System architecture"]
                    },
                    {
                        "name": "Alex Rodriguez", 
                        "match": 88,
                        "skills": ["Figma", "Adobe Creative Suite", "Prototyping"],
                        "experience": "4 years",
                        "reasoning": "Excellent design skills with proven track record",
                        "strengths": ["UI/UX expertise", "User research", "Design systems"],
                        "areas_for_growth": ["Frontend development", "Accessibility standards"]
                    }
                ]
            
        except Exception as e:
            print(f"Error matching candidates: {e}")
            return []
import os
from typing import List, Dict, Optional
import asyncio

class AIService:
    def __init__(self):
        self.mock_mode = True
        self.openai_client = None
    
    def search_courses(self, query: str) -> List[Dict]:
        """Mock course search"""
        return [
            {
                "title": f"Complete {query} Course",
                "provider": "SkillSpring Academy",
                "rating": 4.8,
                "duration": "12 weeks",
                "level": "Intermediate",
                "price": "$99"
            },
            {
                "title": f"Advanced {query} Bootcamp",
                "provider": "TechEd",
                "rating": 4.9,
                "duration": "16 weeks",
                "level": "Advanced",
                "price": "$199"
            }
        ]
    
    def generate_project_ideas(self, query: str) -> List[Dict]:
        """Mock project ideas generation"""
        return [
            {
                "title": f"Build a {query} Portfolio Project",
                "description": f"Create a comprehensive project showcasing {query} skills",
                "difficulty": "Medium",
                "timeEstimate": "2-3 weeks",
                "technologies": [query, "JavaScript", "React"]
            },
            {
                "title": f"{query} API Integration",
                "description": f"Integrate third-party APIs into a {query} application",
                "difficulty": "Hard",
                "timeEstimate": "3-4 weeks",
                "technologies": [query, "REST APIs", "Database"]
            }
        ]
    
    def assess_skills(self, skills: str) -> Dict:
        """Mock skill assessment"""
        return {
            "overall_score": 75,
            "strengths": ["Problem solving", "Technical implementation"],
            "areas_for_improvement": ["System design", "Testing"],
            "recommendations": [
                "Practice system design patterns",
                "Learn test-driven development",
                "Build more complex projects"
            ]
        }
    
    def analyze_job_market(self, role: str) -> Dict:
        """Mock job market analysis"""
        return {
            "demand": "High",
            "average_salary": "$85,000 - $120,000",
            "trending_skills": ["React", "TypeScript", "Node.js", "AWS"],
            "job_growth": "+15% year over year",
            "top_locations": ["San Francisco", "New York", "Seattle", "Remote"]
        }
    
    def optimize_resume(self, resume_content: str) -> List[str]:
        """Mock resume optimization"""
        return [
            "Add quantifiable achievements with metrics",
            "Include relevant keywords for ATS optimization",
            "Highlight technical skills more prominently",
            "Use action verbs to describe accomplishments",
            "Tailor content to specific job requirements"
        ]
    
    def prepare_interview(self, role_company: str) -> Dict:
        """Mock interview preparation"""
        return {
            "common_questions": [
                "Tell me about yourself",
                "Why are you interested in this role?",
                "Describe a challenging project you worked on"
            ],
            "technical_topics": ["Data structures", "Algorithms", "System design"],
            "company_research": [
                "Review company mission and values",
                "Understand recent company news",
                "Research the interviewer's background"
            ],
            "preparation_tips": [
                "Practice coding problems",
                "Prepare specific examples using STAR method",
                "Research the company culture"
            ]
        }
    
    def match_talent(self, requirements: str) -> List[Dict]:
        """Mock talent matching"""
        return [
            {
                "name": "Sarah Chen",
                "match_score": 95,
                "skills": ["React", "Node.js", "Python", "AWS"],
                "experience": "5 years",
                "location": "San Francisco, CA"
            },
            {
                "name": "Alex Rodriguez",
                "match_score": 88,
                "skills": ["JavaScript", "Vue.js", "Python", "Docker"],
                "experience": "4 years",
                "location": "Remote"
            }
        ]
    
    def generate_business_model(self, business_idea: str) -> Dict:
        """Mock business model generation"""
        return {
            "value_proposition": "Solving customer pain points through innovative technology",
            "target_customers": ["Tech-savvy professionals", "SMBs", "Enterprise clients"],
            "revenue_streams": ["Subscription", "Freemium", "Enterprise licenses"],
            "key_activities": ["Product development", "Customer acquisition", "Support"],
            "cost_structure": ["Development", "Marketing", "Operations", "Support"]
        }
    
    def analyze_market(self, industry: str) -> Dict:
        """Mock market analysis"""
        return {
            "market_size": "$50B globally",
            "growth_rate": "12% CAGR",
            "key_trends": ["AI integration", "Remote work", "Sustainability"],
            "competitors": ["Company A", "Company B", "Company C"],
            "opportunities": ["Emerging markets", "New technologies", "Partnerships"]
        }
    
    @staticmethod
    async def generate_career_insights(email: str, profession: str) -> List[str]:
        """Mock career insights"""
        return [
            f"Based on your {profession} background, consider exploring AI/ML integration",
            "The job market for your field is growing by 15% annually",
            "Consider developing cloud computing skills for better opportunities",
            "Remote work opportunities in your field have increased by 40%"
        ]
    
    @staticmethod
    async def generate_startup_insights(email: str, profession: str) -> List[str]:
        """Mock startup insights"""
        return [
            f"The {profession} industry shows strong investment trends",
            "Consider focusing on sustainable and AI-powered solutions",
            "Remote-first startups are attracting 30% more talent",
            "B2B SaaS models show the highest success rates in your sector"
        ]
