
import requests
from bs4 import BeautifulSoup
import csv
import os
from typing import List, Dict
from datetime import datetime
import json
import time

class ContentAggregator:
    def __init__(self):
        self.resources_file = "data/free_resources.csv"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def scrape_freecodecamp_courses(self) -> List[Dict]:
        """Scrape freeCodeCamp curriculum"""
        try:
            url = "https://www.freecodecamp.org/learn"
            response = self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            courses = []
            
            # Find curriculum sections
            curriculum_sections = soup.find_all('div', class_='curriculum-section')
            
            for section in curriculum_sections:
                title_elem = section.find('h2')
                if not title_elem:
                    continue
                    
                title = title_elem.get_text(strip=True)
                description_elem = section.find('p')
                description = description_elem.get_text(strip=True) if description_elem else "Learn " + title
                
                # Determine category and level
                category = self.categorize_freecodecamp_course(title)
                level = self.determine_level_from_title(title)
                
                course_data = {
                    'id': f"fcc_{title.lower().replace(' ', '_')}",
                    'title': f"{title} - freeCodeCamp",
                    'description': description,
                    'provider': 'freeCodeCamp',
                    'category': category,
                    'level': level,
                    'duration': '40+ hours',
                    'url': f"https://www.freecodecamp.org/learn/{title.lower().replace(' ', '-')}",
                    'embed_url': '',
                    'thumbnail': 'https://cdn.freecodecamp.org/platform/universal/fcc_primary.svg',
                    'language': 'English',
                    'tags': self.extract_freecodecamp_tags(title),
                    'rating': 4.9,
                    'created_at': datetime.utcnow().isoformat()
                }
                
                courses.append(course_data)
                time.sleep(0.5)  # Rate limiting
            
            return courses
            
        except Exception as e:
            print(f"Error scraping freeCodeCamp: {e}")
            return []
    
    def scrape_coursera_free_courses(self) -> List[Dict]:
        """Scrape Coursera free courses"""
        try:
            # Coursera free courses search
            free_courses = [
                {
                    'title': 'Introduction to Computer Science and Programming',
                    'provider': 'MIT via Coursera',
                    'category': 'Computer Science',
                    'level': 'Beginner',
                    'url': 'https://www.coursera.org/learn/introduction-to-computer-science-and-programming',
                    'description': 'Learn computer science fundamentals with Python programming'
                },
                {
                    'title': 'Machine Learning Course',
                    'provider': 'Stanford via Coursera',
                    'category': 'Data Science',
                    'level': 'Intermediate',
                    'url': 'https://www.coursera.org/learn/machine-learning',
                    'description': 'Complete machine learning course by Andrew Ng'
                },
                {
                    'title': 'Google UX Design Professional Certificate',
                    'provider': 'Google via Coursera',
                    'category': 'Design',
                    'level': 'Beginner',
                    'url': 'https://www.coursera.org/professional-certificates/google-ux-design',
                    'description': 'Complete UX design course from Google'
                },
                {
                    'title': 'IBM Cybersecurity Analyst Professional Certificate',
                    'provider': 'IBM via Coursera',
                    'category': 'Cybersecurity',
                    'level': 'Intermediate',
                    'url': 'https://www.coursera.org/professional-certificates/ibm-cybersecurity-analyst',
                    'description': 'Cybersecurity fundamentals and hands-on practice'
                }
            ]
            
            courses = []
            for course_info in free_courses:
                course_data = {
                    'id': f"coursera_{course_info['title'].lower().replace(' ', '_')}",
                    'title': course_info['title'],
                    'description': course_info['description'],
                    'provider': course_info['provider'],
                    'category': course_info['category'],
                    'level': course_info['level'],
                    'duration': '20-40 hours',
                    'url': course_info['url'],
                    'embed_url': '',
                    'thumbnail': 'https://coursera-course-photos.s3.amazonaws.com/fb/e9a140d2f011e6837b75a2e817a54c/Coursera-logo-square.png',
                    'language': 'English',
                    'tags': self.extract_tags_from_title(course_info['title']),
                    'rating': 4.7,
                    'created_at': datetime.utcnow().isoformat()
                }
                courses.append(course_data)
            
            return courses
            
        except Exception as e:
            print(f"Error getting Coursera courses: {e}")
            return []
    
    def get_edx_free_courses(self) -> List[Dict]:
        """Get edX free courses"""
        try:
            free_courses = [
                {
                    'title': 'CS50: Introduction to Computer Science',
                    'provider': 'Harvard via edX',
                    'category': 'Computer Science',
                    'level': 'Beginner',
                    'url': 'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x',
                    'description': 'Harvard\'s introduction to computer science and programming',
                    'embed_url': 'https://www.youtube.com/embed/8mAITcNt710'
                },
                {
                    'title': 'Introduction to Artificial Intelligence',
                    'provider': 'MIT via edX',
                    'category': 'AI',
                    'level': 'Intermediate',
                    'url': 'https://www.edx.org/course/artificial-intelligence-ai',
                    'description': 'Introduction to AI concepts and algorithms'
                },
                {
                    'title': 'Introduction to Data Science',
                    'provider': 'Microsoft via edX',
                    'category': 'Data Science',
                    'level': 'Beginner',
                    'url': 'https://www.edx.org/course/introduction-to-data-science',
                    'description': 'Learn data science fundamentals with Python'
                }
            ]
            
            courses = []
            for course_info in free_courses:
                course_data = {
                    'id': f"edx_{course_info['title'].lower().replace(' ', '_').replace(':', '')}",
                    'title': course_info['title'],
                    'description': course_info['description'],
                    'provider': course_info['provider'],
                    'category': course_info['category'],
                    'level': course_info['level'],
                    'duration': '30-50 hours',
                    'url': course_info['url'],
                    'embed_url': course_info.get('embed_url', ''),
                    'thumbnail': 'https://www.edx.org/images/logos/edx-logo-elm.svg',
                    'language': 'English',
                    'tags': self.extract_tags_from_title(course_info['title']),
                    'rating': 4.8,
                    'created_at': datetime.utcnow().isoformat()
                }
                courses.append(course_data)
            
            return courses
            
        except Exception as e:
            print(f"Error getting edX courses: {e}")
            return []
    
    def get_khan_academy_courses(self) -> List[Dict]:
        """Get Khan Academy courses"""
        try:
            courses_info = [
                {
                    'title': 'Computer Programming',
                    'category': 'Computer Science',
                    'level': 'Beginner',
                    'description': 'Learn programming with interactive exercises'
                },
                {
                    'title': 'Computer Science Principles',
                    'category': 'Computer Science',
                    'level': 'Intermediate',
                    'description': 'Fundamental computer science concepts'
                },
                {
                    'title': 'Statistics and Probability',
                    'category': 'Data Science',
                    'level': 'Beginner',
                    'description': 'Statistical analysis and data interpretation'
                }
            ]
            
            courses = []
            for course_info in courses_info:
                course_data = {
                    'id': f"khan_{course_info['title'].lower().replace(' ', '_')}",
                    'title': f"{course_info['title']} - Khan Academy",
                    'description': course_info['description'],
                    'provider': 'Khan Academy',
                    'category': course_info['category'],
                    'level': course_info['level'],
                    'duration': '15-25 hours',
                    'url': f"https://www.khanacademy.org/computing/{course_info['title'].lower().replace(' ', '-')}",
                    'embed_url': '',
                    'thumbnail': 'https://cdn.kastatic.org/images/khan-logo-dark-background.png',
                    'language': 'English',
                    'tags': self.extract_tags_from_title(course_info['title']),
                    'rating': 4.6,
                    'created_at': datetime.utcnow().isoformat()
                }
                courses.append(course_data)
            
            return courses
            
        except Exception as e:
            print(f"Error getting Khan Academy courses: {e}")
            return []
    
    def categorize_freecodecamp_course(self, title: str) -> str:
        """Categorize freeCodeCamp course"""
        title_lower = title.lower()
        
        if any(word in title_lower for word in ['web', 'frontend', 'backend', 'javascript', 'html', 'css']):
            return 'Web Development'
        elif any(word in title_lower for word in ['data', 'analysis', 'visualization', 'python']):
            return 'Data Science'
        elif any(word in title_lower for word in ['machine learning', 'ai', 'tensorflow']):
            return 'AI'
        elif any(word in title_lower for word in ['security', 'information']):
            return 'Cybersecurity'
        else:
            return 'Computer Science'
    
    def determine_level_from_title(self, title: str) -> str:
        """Determine level from course title"""
        title_lower = title.lower()
        
        if any(word in title_lower for word in ['basic', 'intro', 'fundamental', 'beginner']):
            return 'Beginner'
        elif any(word in title_lower for word in ['advanced', 'expert', 'professional']):
            return 'Advanced'
        else:
            return 'Intermediate'
    
    def extract_freecodecamp_tags(self, title: str) -> List[str]:
        """Extract tags from freeCodeCamp course title"""
        title_lower = title.lower()
        tags = []
        
        tag_mapping = {
            'web': ['HTML', 'CSS', 'JavaScript'],
            'frontend': ['React', 'Frontend', 'UI'],
            'backend': ['Node.js', 'Backend', 'API'],
            'data': ['Python', 'Data Analysis', 'Visualization'],
            'machine': ['Machine Learning', 'AI', 'Python'],
            'security': ['Security', 'Cybersecurity']
        }
        
        for keyword, related_tags in tag_mapping.items():
            if keyword in title_lower:
                tags.extend(related_tags)
        
        return tags[:8]
    
    def extract_tags_from_title(self, title: str) -> List[str]:
        """Extract tags from course title"""
        title_lower = title.lower()
        
        common_tags = {
            'computer science': ['Programming', 'Algorithms', 'Computer Science'],
            'machine learning': ['Machine Learning', 'AI', 'Python'],
            'data science': ['Data Science', 'Python', 'Statistics'],
            'artificial intelligence': ['AI', 'Machine Learning', 'Deep Learning'],
            'programming': ['Programming', 'Coding', 'Software Development'],
            'design': ['Design', 'UI', 'UX'],
            'cybersecurity': ['Security', 'Cybersecurity', 'Network Security']
        }
        
        tags = []
        for keyword, related_tags in common_tags.items():
            if keyword in title_lower:
                tags.extend(related_tags)
        
        # Add specific technology tags
        tech_keywords = ['python', 'javascript', 'java', 'c++', 'react', 'html', 'css']
        for tech in tech_keywords:
            if tech in title_lower:
                tags.append(tech.title())
        
        return list(set(tags))[:8]  # Remove duplicates and limit to 8
    
    def aggregate_all_content(self) -> int:
        """Aggregate content from all platforms"""
        try:
            all_resources = []
            
            print("Aggregating freeCodeCamp courses...")
            fcc_courses = self.scrape_freecodecamp_courses()
            all_resources.extend(fcc_courses)
            
            print("Aggregating Coursera free courses...")
            coursera_courses = self.scrape_coursera_free_courses()
            all_resources.extend(coursera_courses)
            
            print("Aggregating edX courses...")
            edx_courses = self.get_edx_free_courses()
            all_resources.extend(edx_courses)
            
            print("Aggregating Khan Academy courses...")
            khan_courses = self.get_khan_academy_courses()
            all_resources.extend(khan_courses)
            
            # Read existing resources
            existing_resources = []
            if os.path.exists(self.resources_file):
                with open(self.resources_file, 'r', encoding='utf-8') as file:
                    reader = csv.DictReader(file)
                    existing_resources = list(reader)
            
            # Add new resources (avoid duplicates)
            existing_ids = {resource['id'] for resource in existing_resources}
            new_resources = [resource for resource in all_resources if resource['id'] not in existing_ids]
            
            # Combine all resources
            all_combined = existing_resources + new_resources
            
            # Write back to file
            if all_combined:
                with open(self.resources_file, 'w', newline='', encoding='utf-8') as file:
                    fieldnames = [
                        'id', 'title', 'description', 'provider', 'category', 'level',
                        'duration', 'url', 'embed_url', 'thumbnail', 'language',
                        'tags', 'rating', 'created_at'
                    ]
                    writer = csv.DictWriter(file, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for resource in all_combined:
                        # Convert tags list to string for CSV
                        if isinstance(resource.get('tags'), list):
                            resource['tags'] = ','.join(resource['tags'])
                        
                        # Only write required fields
                        row = {field: resource.get(field, '') for field in fieldnames}
                        writer.writerow(row)
            
            print(f"Added {len(new_resources)} new resources from external platforms")
            return len(new_resources)
            
        except Exception as e:
            print(f"Error in content aggregation: {e}")
            return 0
