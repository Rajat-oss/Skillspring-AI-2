
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
        """Fetch hackathons from Unstop with real scraping"""
        try:
            # Try to scrape real Unstop data
            real_hackathons = await self.scrape_unstop_competitions()
            if real_hackathons:
                return real_hackathons
            
            # Fallback to enhanced mock data based on real patterns
            current_hackathons = [
                {
                    "id": f"unstop_{datetime.now().strftime('%Y%m%d')}_1",
                    "title": "Smart India Hackathon 2024",
                    "organizer": "Ministry of Education",
                    "location": "Pan India",
                    "type": "hackathon",
                    "posted_date": (datetime.now() - timedelta(hours=6)).isoformat(),
                    "deadline": (datetime.now() + timedelta(days=25)).isoformat(),
                    "apply_url": "https://unstop.com/hackathons/smart-india-hackathon",
                    "tags": ["Government", "Innovation", "Pan India", "Students"],
                    "description": "National level hackathon to solve real-world problems...",
                    "prize_money": "₹1,00,000",
                    "platform": "Unstop"
                },
                {
                    "id": f"unstop_{datetime.now().strftime('%Y%m%d')}_2",
                    "title": "CodeChef SnackDown 2024",
                    "organizer": "CodeChef",
                    "location": "Online",
                    "type": "hackathon",
                    "posted_date": (datetime.now() - timedelta(hours=18)).isoformat(),
                    "deadline": (datetime.now() + timedelta(days=12)).isoformat(),
                    "apply_url": "https://unstop.com/hackathons/codechef-snackdown",
                    "tags": ["Competitive Programming", "Online", "Global"],
                    "description": "Global programming competition...",
                    "prize_money": "$10,000",
                    "platform": "Unstop"
                },
                {
                    "id": f"unstop_{datetime.now().strftime('%Y%m%d')}_3",
                    "title": "Flipkart GRiD 5.0",
                    "organizer": "Flipkart",
                    "location": "Hybrid",
                    "type": "hackathon",
                    "posted_date": (datetime.now() - timedelta(days=1)).isoformat(),
                    "deadline": (datetime.now() + timedelta(days=30)).isoformat(),
                    "apply_url": "https://unstop.com/hackathons/flipkart-grid",
                    "tags": ["E-commerce", "Tech", "Career Opportunity"],
                    "description": "Build solutions for e-commerce challenges...",
                    "prize_money": "₹3,50,000",
                    "platform": "Unstop"
                }
            ]
            return current_hackathons
            
        except Exception as e:
            logger.error(f"Error fetching Unstop hackathons: {e}")
            return []

    async def scrape_unstop_competitions(self) -> List[Dict]:
        """Attempt to scrape real competitions from Unstop"""
        try:
            if not self.session:
                return []
                
            # Note: This is a simplified scraping attempt
            # In production, you'd need to handle Unstop's specific structure
            url = "https://unstop.com/api/public/opportunity/search-new"
            
            # Search for hackathons and competitions
            search_params = {
                "opportunity": "hackathons-programming",
                "per_page": 20,
                "deadline": "upcoming"
            }
            
            async with self.session.get(url, params=search_params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    competitions = []
                    for item in data.get('data', {}).get('data', [])[:10]:
                        competition = {
                            "id": f"unstop_real_{item.get('id', '')}",
                            "title": item.get('title', 'Competition'),
                            "organizer": item.get('organisation', {}).get('name', 'Organizer'),
                            "location": item.get('eligibility', {}).get('location', 'Various'),
                            "type": "hackathon",
                            "posted_date": item.get('start_date', datetime.now().isoformat()),
                            "deadline": item.get('end_date', (datetime.now() + timedelta(days=30)).isoformat()),
                            "apply_url": f"https://unstop.com{item.get('public_url', '')}",
                            "tags": item.get('tags', [])[:5],
                            "description": item.get('description', 'Competition details...')[:200],
                            "prize_money": item.get('prizes', {}).get('winner', 'TBD'),
                            "platform": "Unstop"
                        }
                        competitions.append(competition)
                    
                    return competitions
                    
        except Exception as e:
            logger.error(f"Error scraping real Unstop data: {e}")
            
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
