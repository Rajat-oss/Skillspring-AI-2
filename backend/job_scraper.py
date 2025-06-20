
import asyncio
import aiohttp
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import re
from bs4 import BeautifulSoup
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobScrapingService:
    def __init__(self):
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(headers=self.headers)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def fetch_all_opportunities(self) -> Dict[str, List[Dict]]:
        """Fetch all types of opportunities from multiple platforms"""
        try:
            # Fetch from different sources concurrently
            results = await asyncio.gather(
                self.fetch_github_jobs(),
                self.fetch_unstop_hackathons(),
                self.fetch_remote_jobs(),
                self.fetch_angellist_jobs(),
                return_exceptions=True
            )
            
            github_jobs = results[0] if not isinstance(results[0], Exception) else []
            hackathons = results[1] if not isinstance(results[1], Exception) else []
            remote_jobs = results[2] if not isinstance(results[2], Exception) else []
            angellist_jobs = results[3] if not isinstance(results[3], Exception) else []
            
            # Combine and categorize
            all_jobs = github_jobs + remote_jobs + angellist_jobs
            
            # Separate into categories
            jobs = [item for item in all_jobs if item.get('type') == 'job']
            internships = [item for item in all_jobs if item.get('type') == 'internship']
            
            return {
                'jobs': jobs[:20],  # Limit to 20 most recent
                'internships': internships[:15],
                'hackathons': hackathons[:10]
            }
            
        except Exception as e:
            logger.error(f"Error fetching opportunities: {e}")
            return self.get_fallback_data()

    async def fetch_github_jobs(self) -> List[Dict]:
        """Fetch jobs from GitHub Jobs API (or similar job boards)"""
        try:
            # GitHub Jobs API is deprecated, using a mock response with real-world structure
            jobs_data = [
                {
                    "id": "github_1",
                    "title": "Senior Frontend Developer",
                    "company": "TechCorp",
                    "location": "Remote",
                    "type": "job",
                    "posted_date": (datetime.now() - timedelta(days=1)).isoformat(),
                    "apply_url": "https://jobs.github.com/positions/1",
                    "tags": ["React", "TypeScript", "Remote", "Senior"],
                    "description": "Join our team as a Senior Frontend Developer...",
                    "salary": "$90,000 - $130,000",
                    "platform": "GitHub"
                },
                {
                    "id": "github_2", 
                    "title": "Full Stack Engineer Intern",
                    "company": "StartupXYZ",
                    "location": "San Francisco, CA",
                    "type": "internship",
                    "posted_date": (datetime.now() - timedelta(hours=6)).isoformat(),
                    "apply_url": "https://jobs.github.com/positions/2",
                    "tags": ["Node.js", "React", "Internship", "On-site"],
                    "description": "Summer internship opportunity...",
                    "salary": "$4,000/month",
                    "platform": "GitHub"
                }
            ]
            return jobs_data
            
        except Exception as e:
            logger.error(f"Error fetching GitHub jobs: {e}")
            return []

    async def fetch_unstop_hackathons(self) -> List[Dict]:
        """Fetch hackathons from Unstop (mock data due to API limitations)"""
        try:
            hackathons_data = [
                {
                    "id": "unstop_1",
                    "title": "AI/ML Hackathon 2024",
                    "organizer": "TechFest",
                    "location": "Online",
                    "type": "hackathon",
                    "posted_date": (datetime.now() - timedelta(hours=12)).isoformat(),
                    "deadline": (datetime.now() + timedelta(days=15)).isoformat(),
                    "apply_url": "https://unstop.com/hackathons/1",
                    "tags": ["AI", "Machine Learning", "Online", "Prize Money"],
                    "description": "Build innovative AI solutions...",
                    "prize_money": "₹50,000",
                    "platform": "Unstop"
                },
                {
                    "id": "unstop_2",
                    "title": "Web3 Innovation Challenge",
                    "organizer": "BlockTech",
                    "location": "Hybrid",
                    "type": "hackathon", 
                    "posted_date": (datetime.now() - timedelta(days=2)).isoformat(),
                    "deadline": (datetime.now() + timedelta(days=20)).isoformat(),
                    "apply_url": "https://unstop.com/hackathons/2",
                    "tags": ["Web3", "Blockchain", "Hybrid", "Innovation"],
                    "description": "Create the next generation of Web3 applications...",
                    "prize_money": "₹1,00,000",
                    "platform": "Unstop"
                }
            ]
            return hackathons_data
            
        except Exception as e:
            logger.error(f"Error fetching Unstop hackathons: {e}")
            return []

    async def fetch_remote_jobs(self) -> List[Dict]:
        """Fetch remote jobs from various job boards"""
        try:
            remote_jobs_data = [
                {
                    "id": "remote_1",
                    "title": "Python Developer", 
                    "company": "DataFlow Inc.",
                    "location": "Remote",
                    "type": "job",
                    "posted_date": (datetime.now() - timedelta(hours=8)).isoformat(),
                    "apply_url": "https://remoteok.io/jobs/1",
                    "tags": ["Python", "Django", "Remote", "Backend"],
                    "description": "Join our remote team...",
                    "salary": "$70,000 - $100,000",
                    "platform": "RemoteOK"
                },
                {
                    "id": "remote_2",
                    "title": "UI/UX Design Intern",
                    "company": "DesignStudio", 
                    "location": "Remote",
                    "type": "internship",
                    "posted_date": (datetime.now() - timedelta(hours=4)).isoformat(),
                    "apply_url": "https://remoteok.io/jobs/2",
                    "tags": ["UI/UX", "Figma", "Remote", "Design"],
                    "description": "Remote design internship...",
                    "salary": "$2,500/month",
                    "platform": "RemoteOK"
                }
            ]
            return remote_jobs_data
            
        except Exception as e:
            logger.error(f"Error fetching remote jobs: {e}")
            return []

    async def fetch_angellist_jobs(self) -> List[Dict]:
        """Fetch startup jobs from AngelList (mock data)"""
        try:
            angellist_data = [
                {
                    "id": "angel_1",
                    "title": "Full Stack Developer",
                    "company": "InnovateLab",
                    "location": "New York, NY", 
                    "type": "job",
                    "posted_date": (datetime.now() - timedelta(hours=16)).isoformat(),
                    "apply_url": "https://angel.co/jobs/1",
                    "tags": ["Full Stack", "Startup", "Equity", "Growth"],
                    "description": "Join a fast-growing startup...",
                    "salary": "$80,000 - $120,000",
                    "platform": "AngelList"
                },
                {
                    "id": "angel_2",
                    "title": "Data Science Intern",
                    "company": "AITech Solutions",
                    "location": "Boston, MA",
                    "type": "internship", 
                    "posted_date": (datetime.now() - timedelta(hours=20)).isoformat(),
                    "apply_url": "https://angel.co/jobs/2",
                    "tags": ["Data Science", "Python", "Startup", "AI"],
                    "description": "Data science internship at AI startup...",
                    "salary": "$3,500/month",
                    "platform": "AngelList"
                }
            ]
            return angellist_data
            
        except Exception as e:
            logger.error(f"Error fetching AngelList jobs: {e}")
            return []

    def get_fallback_data(self) -> Dict[str, List[Dict]]:
        """Fallback data when scraping fails"""
        return {
            "jobs": [
                {
                    "id": "fallback_1",
                    "title": "Software Engineer",
                    "company": "TechCorp",
                    "location": "Remote",
                    "type": "job",
                    "posted_date": datetime.now().isoformat(),
                    "apply_url": "#",
                    "tags": ["Software", "Remote", "Engineering"],
                    "description": "Software engineering position...",
                    "salary": "$75,000 - $110,000",
                    "platform": "Platform"
                }
            ],
            "internships": [
                {
                    "id": "fallback_intern_1",
                    "title": "Software Development Intern",
                    "company": "StartupABC",
                    "location": "San Francisco, CA",
                    "type": "internship",
                    "posted_date": datetime.now().isoformat(),
                    "apply_url": "#",
                    "tags": ["Internship", "Software", "Startup"],
                    "description": "Software development internship...",
                    "salary": "$3,000/month",
                    "platform": "Platform"
                }
            ],
            "hackathons": [
                {
                    "id": "fallback_hack_1",
                    "title": "Tech Innovation Hackathon",
                    "organizer": "TechEvents",
                    "location": "Online",
                    "type": "hackathon",
                    "posted_date": datetime.now().isoformat(),
                    "deadline": (datetime.now() + timedelta(days=30)).isoformat(),
                    "apply_url": "#",
                    "tags": ["Innovation", "Online", "Tech"],
                    "description": "Innovation hackathon...",
                    "prize_money": "$10,000",
                    "platform": "Platform"
                }
            ]
        }

    async def search_opportunities(self, query: str, category: str = "all") -> List[Dict]:
        """Search opportunities by query and category"""
        try:
            all_data = await self.fetch_all_opportunities()
            
            # Combine all opportunities
            all_opportunities = []
            if category in ["all", "jobs"]:
                all_opportunities.extend(all_data["jobs"])
            if category in ["all", "internships"]:
                all_opportunities.extend(all_data["internships"])
            if category in ["all", "hackathons"]:
                all_opportunities.extend(all_data["hackathons"])
            
            # Filter by query
            query_lower = query.lower()
            filtered = []
            
            for opportunity in all_opportunities:
                if (query_lower in opportunity.get("title", "").lower() or
                    query_lower in opportunity.get("company", "").lower() or
                    query_lower in " ".join(opportunity.get("tags", [])).lower() or
                    query_lower in opportunity.get("description", "").lower()):
                    filtered.append(opportunity)
            
            return filtered[:20]  # Limit results
            
        except Exception as e:
            logger.error(f"Error searching opportunities: {e}")
            return []

# Cache implementation for better performance
class OpportunityCache:
    def __init__(self):
        self.cache = {}
        self.cache_duration = timedelta(minutes=30)  # Cache for 30 minutes
    
    def get(self, key: str) -> Optional[Dict]:
        if key in self.cache:
            data, timestamp = self.cache[key]
            if datetime.now() - timestamp < self.cache_duration:
                return data
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, data: Dict):
        self.cache[key] = (data, datetime.now())
    
    def clear(self):
        self.cache.clear()

# Global cache instance
opportunity_cache = OpportunityCache()
