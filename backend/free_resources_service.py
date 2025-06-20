
import json
import os
from typing import List, Dict, Optional
from datetime import datetime
import csv

class FreeResourcesService:
    def __init__(self):
        self.resources_file = "data/free_resources.csv"
        self.user_bookmarks_file = "data/user_bookmarks.csv"
        self.init_resources()

    def init_resources(self):
        """Initialize free resources database"""
        os.makedirs("data", exist_ok=True)
        
        if not os.path.exists(self.resources_file):
            with open(self.resources_file, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow([
                    'id', 'title', 'description', 'provider', 'category', 'level',
                    'duration', 'url', 'embed_url', 'thumbnail', 'language',
                    'tags', 'rating', 'created_at'
                ])
                
                # Sample free resources
                sample_resources = [
                    # Web Development
                    ['1', 'Complete Web Development Bootcamp', 'Full-stack web development course covering HTML, CSS, JavaScript, React, Node.js', 'freeCodeCamp', 'Web Development', 'Beginner', '40 hours', 'https://www.freecodecamp.org/learn/responsive-web-design/', 'https://www.youtube.com/embed/pQN-pnXPaVg', 'https://img.youtube.com/vi/pQN-pnXPaVg/maxresdefault.jpg', 'English', 'HTML,CSS,JavaScript,React,Node.js', '4.8', '2024-01-01'],
                    ['2', 'React Tutorial for Beginners', 'Complete React.js tutorial from basics to advanced concepts', 'Programming with Mosh', 'Web Development', 'Beginner', '6 hours', 'https://youtu.be/SqcY0GlETPk', 'https://www.youtube.com/embed/SqcY0GlETPk', 'https://img.youtube.com/vi/SqcY0GlETPk/maxresdefault.jpg', 'English', 'React,JavaScript,Frontend', '4.7', '2024-01-02'],
                    ['3', 'Node.js Full Course', 'Complete Node.js tutorial covering backend development', 'freeCodeCamp', 'Web Development', 'Intermediate', '8 hours', 'https://youtu.be/RLtyhiShda8', 'https://www.youtube.com/embed/RLtyhiShda8', 'https://img.youtube.com/vi/RLtyhiShda8/maxresdefault.jpg', 'English', 'Node.js,Backend,API', '4.6', '2024-01-03'],
                    
                    # Data Science
                    ['4', 'Python for Data Science', 'Complete Python data science course with pandas, numpy, matplotlib', 'Kaggle Learn', 'Data Science', 'Beginner', '20 hours', 'https://www.kaggle.com/learn/python', '', 'https://storage.googleapis.com/kaggle-learn/images/python-course.png', 'English', 'Python,Pandas,NumPy,Data Analysis', '4.5', '2024-01-04'],
                    ['5', 'Machine Learning Course', 'Complete machine learning course by Andrew Ng', 'Stanford Online', 'Data Science', 'Intermediate', '60 hours', 'https://www.coursera.org/learn/machine-learning', '', 'https://d3c33hcgiwev3.cloudfront.net/imageAssetProxy.v1/ZR6TuCT5Eeijuw4zN2SHVw_7c7095c7e6d147a192a98897b5b1e8da_machineLearning_large_icon.png', 'English', 'Machine Learning,Python,AI', '4.9', '2024-01-05'],
                    ['6', 'Data Analysis with Python', 'Complete data analysis course using Python libraries', 'freeCodeCamp', 'Data Science', 'Beginner', '10 hours', 'https://youtu.be/r-uOLxNrNk8', 'https://www.youtube.com/embed/r-uOLxNrNk8', 'https://img.youtube.com/vi/r-uOLxNrNk8/maxresdefault.jpg', 'English', 'Python,Data Analysis,Pandas', '4.4', '2024-01-06'],
                    
                    # AI & Machine Learning
                    ['7', 'Deep Learning Specialization', 'Complete deep learning course covering neural networks', 'deeplearning.ai', 'AI', 'Advanced', '80 hours', 'https://www.coursera.org/specializations/deep-learning', '', 'https://d3c33hcgiwev3.cloudfront.net/imageAssetProxy.v1/nDQFT6CCSJqtv8MHUZsrAw_5bb9d82b5e1c4c00b8b66fa9d37c8dde_DL-Logo-Purple.png', 'English', 'Deep Learning,Neural Networks,TensorFlow', '4.8', '2024-01-07'],
                    ['8', 'AI for Everyone', 'Non-technical introduction to artificial intelligence', 'deeplearning.ai', 'AI', 'Beginner', '12 hours', 'https://www.coursera.org/learn/ai-for-everyone', '', 'https://d3c33hcgiwev3.cloudfront.net/imageAssetProxy.v1/pBgAAoHrEem02xI9cMStXA_89e9a83c7d9045c9b5c7c3a6b5b2b9dc_AI-for-Everyone-Logo.png', 'English', 'AI,Machine Learning,Business', '4.7', '2024-01-08'],
                    
                    # Computer Science Fundamentals
                    ['9', 'CS50: Introduction to Computer Science', 'Harvard\'s introduction to computer science', 'Harvard University', 'Computer Science', 'Beginner', '50 hours', 'https://cs50.harvard.edu/x/2024/', 'https://www.youtube.com/embed/8mAITcNt710', 'https://img.youtube.com/vi/8mAITcNt710/maxresdefault.jpg', 'English', 'Programming,Algorithms,C,Python', '4.9', '2024-01-09'],
                    ['10', 'Data Structures and Algorithms', 'Complete DSA course for programming interviews', 'freeCodeCamp', 'Computer Science', 'Intermediate', '8 hours', 'https://youtu.be/RBSGKlAvoiM', 'https://www.youtube.com/embed/RBSGKlAvoiM', 'https://img.youtube.com/vi/RBSGKlAvoiM/maxresdefault.jpg', 'English', 'Algorithms,Data Structures,Programming', '4.6', '2024-01-10'],
                    
                    # Design
                    ['11', 'UI/UX Design Fundamentals', 'Complete UI/UX design course for beginners', 'Google UX Design', 'Design', 'Beginner', '30 hours', 'https://www.coursera.org/professional-certificates/google-ux-design', '', 'https://d3c33hcgiwev3.cloudfront.net/imageAssetProxy.v1/gY2n6a3lR5-LNDFpIHGWCg_b94d89c72a5e4a33a68ae7b7b87fdf9c_UX-Design-Certificate-Logo.png', 'English', 'UI Design,UX Design,Figma,Prototyping', '4.5', '2024-01-11'],
                    ['12', 'Graphic Design Basics', 'Fundamentals of graphic design and visual communication', 'California Institute of the Arts', 'Design', 'Beginner', '20 hours', 'https://www.coursera.org/learn/fundamentals-of-graphic-design', '', 'https://d3c33hcgiwev3.cloudfront.net/imageAssetProxy.v1/tOV_MUKYEeWQXhILd0SdCw_4bc16600463e48e084f4b79c3df89976_CalArts_GraphicDesign_SpecLogo_600x400.png', 'English', 'Graphic Design,Typography,Adobe', '4.4', '2024-01-12'],
                    
                    # Cybersecurity
                    ['13', 'Cybersecurity Fundamentals', 'Introduction to cybersecurity concepts and practices', 'IBM', 'Cybersecurity', 'Beginner', '25 hours', 'https://www.coursera.org/learn/introduction-cybersecurity-cyber-attacks', '', 'https://d3c33hcgiwev3.cloudfront.net/imageAssetProxy.v1/uQDOGa4oEei5YQ6FnP9oqQ_f3c4f6f0b3ce4c0ca1b4e8b1e0b2e6a4_IBM-Logo.png', 'English', 'Security,Network Security,Encryption', '4.3', '2024-01-13'],
                    ['14', 'Ethical Hacking Course', 'Complete ethical hacking and penetration testing course', 'Cybrary', 'Cybersecurity', 'Advanced', '40 hours', 'https://www.cybrary.it/course/ethical-hacking', '', 'https://cdn.cybrary.it/wp-content/uploads/2019/06/ethical-hacking-course-image.jpg', 'English', 'Ethical Hacking,Penetration Testing,Security', '4.2', '2024-01-14'],
                    
                    # Mobile Development
                    ['15', 'Flutter Development Course', 'Complete Flutter mobile app development course', 'freeCodeCamp', 'Mobile Development', 'Beginner', '12 hours', 'https://youtu.be/VPvVD8t02U8', 'https://www.youtube.com/embed/VPvVD8t02U8', 'https://img.youtube.com/vi/VPvVD8t02U8/maxresdefault.jpg', 'English', 'Flutter,Dart,Mobile Development', '4.5', '2024-01-15'],
                    ['16', 'React Native Tutorial', 'Build mobile apps with React Native', 'Programming with Mosh', 'Mobile Development', 'Intermediate', '8 hours', 'https://youtu.be/0-S5a0eXPoc', 'https://www.youtube.com/embed/0-S5a0eXPoc', 'https://img.youtube.com/vi/0-S5a0eXPoc/maxresdefault.jpg', 'English', 'React Native,Mobile,JavaScript', '4.6', '2024-01-16'],
                ]
                
                writer.writerows(sample_resources)

        if not os.path.exists(self.user_bookmarks_file):
            with open(self.user_bookmarks_file, 'w', newline='') as file:
                writer = csv.writer(file)
                writer.writerow(['user_id', 'resource_id', 'status', 'progress', 'bookmarked_at', 'last_accessed'])

    def get_all_resources(self) -> List[Dict]:
        """Get all available free resources"""
        resources = []
        try:
            with open(self.resources_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    resources.append({
                        'id': row['id'],
                        'title': row['title'],
                        'description': row['description'],
                        'provider': row['provider'],
                        'category': row['category'],
                        'level': row['level'],
                        'duration': row['duration'],
                        'url': row['url'],
                        'embed_url': row['embed_url'],
                        'thumbnail': row['thumbnail'],
                        'language': row['language'],
                        'tags': row['tags'].split(',') if row['tags'] else [],
                        'rating': float(row['rating']) if row['rating'] else 0,
                        'created_at': row['created_at']
                    })
        except Exception as e:
            print(f"Error reading resources: {e}")
        return resources

    def search_resources(self, query: str = "", category: str = "", level: str = "", language: str = "") -> List[Dict]:
        """Search resources with filters"""
        all_resources = self.get_all_resources()
        filtered_resources = []

        for resource in all_resources:
            # Text search
            if query and query.lower() not in resource['title'].lower() and \
               query.lower() not in resource['description'].lower() and \
               query.lower() not in ' '.join(resource['tags']).lower():
                continue
            
            # Category filter
            if category and category != resource['category']:
                continue
            
            # Level filter
            if level and level != resource['level']:
                continue
            
            # Language filter
            if language and language != resource['language']:
                continue
            
            filtered_resources.append(resource)

        return filtered_resources

    def get_categories(self) -> List[str]:
        """Get all available categories"""
        resources = self.get_all_resources()
        categories = list(set(resource['category'] for resource in resources))
        return sorted(categories)

    def get_levels(self) -> List[str]:
        """Get all available difficulty levels"""
        return ['Beginner', 'Intermediate', 'Advanced']

    def get_languages(self) -> List[str]:
        """Get all available languages"""
        resources = self.get_all_resources()
        languages = list(set(resource['language'] for resource in resources))
        return sorted(languages)

    def get_user_bookmarks(self, user_id: str) -> List[Dict]:
        """Get user's bookmarked resources with details"""
        bookmarks = []
        try:
            if not os.path.exists(self.user_bookmarks_file):
                return bookmarks

            with open(self.user_bookmarks_file, 'r') as file:
                reader = csv.DictReader(file)
                user_bookmarks = [row for row in reader if row['user_id'] == user_id]

            all_resources = {r['id']: r for r in self.get_all_resources()}
            
            for bookmark in user_bookmarks:
                resource_id = bookmark['resource_id']
                if resource_id in all_resources:
                    resource = all_resources[resource_id].copy()
                    resource['bookmark_status'] = bookmark['status']
                    resource['progress'] = int(bookmark['progress']) if bookmark['progress'] else 0
                    resource['bookmarked_at'] = bookmark['bookmarked_at']
                    resource['last_accessed'] = bookmark['last_accessed']
                    bookmarks.append(resource)
                    
        except Exception as e:
            print(f"Error reading bookmarks: {e}")
        
        return bookmarks

    def bookmark_resource(self, user_id: str, resource_id: str, status: str = 'bookmarked') -> Dict:
        """Bookmark a resource for a user"""
        try:
            # Read existing bookmarks
            bookmarks = []
            if os.path.exists(self.user_bookmarks_file):
                with open(self.user_bookmarks_file, 'r') as file:
                    reader = csv.DictReader(file)
                    bookmarks = list(reader)

            # Check if already bookmarked
            existing_bookmark = None
            for i, bookmark in enumerate(bookmarks):
                if bookmark['user_id'] == user_id and bookmark['resource_id'] == resource_id:
                    existing_bookmark = i
                    break

            bookmark_data = {
                'user_id': user_id,
                'resource_id': resource_id,
                'status': status,
                'progress': '0',
                'bookmarked_at': datetime.utcnow().isoformat(),
                'last_accessed': datetime.utcnow().isoformat()
            }

            if existing_bookmark is not None:
                bookmarks[existing_bookmark] = bookmark_data
            else:
                bookmarks.append(bookmark_data)

            # Write back to file
            with open(self.user_bookmarks_file, 'w', newline='') as file:
                if bookmarks:
                    writer = csv.DictWriter(file, fieldnames=bookmarks[0].keys())
                    writer.writeheader()
                    writer.writerows(bookmarks)

            return {'status': 'success', 'message': f'Resource {status}'}

        except Exception as e:
            print(f"Error bookmarking resource: {e}")
            return {'status': 'error', 'message': 'Failed to bookmark resource'}

    def update_progress(self, user_id: str, resource_id: str, progress: int) -> Dict:
        """Update learning progress for a resource"""
        try:
            bookmarks = []
            if os.path.exists(self.user_bookmarks_file):
                with open(self.user_bookmarks_file, 'r') as file:
                    reader = csv.DictReader(file)
                    bookmarks = list(reader)

            # Find and update the bookmark
            updated = False
            for bookmark in bookmarks:
                if bookmark['user_id'] == user_id and bookmark['resource_id'] == resource_id:
                    bookmark['progress'] = str(progress)
                    bookmark['last_accessed'] = datetime.utcnow().isoformat()
                    if progress >= 100:
                        bookmark['status'] = 'completed'
                    elif progress > 0:
                        bookmark['status'] = 'in_progress'
                    updated = True
                    break

            if not updated:
                # Create new bookmark if doesn't exist
                new_bookmark = {
                    'user_id': user_id,
                    'resource_id': resource_id,
                    'status': 'completed' if progress >= 100 else 'in_progress',
                    'progress': str(progress),
                    'bookmarked_at': datetime.utcnow().isoformat(),
                    'last_accessed': datetime.utcnow().isoformat()
                }
                bookmarks.append(new_bookmark)

            # Write back to file
            with open(self.user_bookmarks_file, 'w', newline='') as file:
                if bookmarks:
                    fieldnames = ['user_id', 'resource_id', 'status', 'progress', 'bookmarked_at', 'last_accessed']
                    writer = csv.DictWriter(file, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(bookmarks)

            return {'status': 'success', 'message': 'Progress updated'}

        except Exception as e:
            print(f"Error updating progress: {e}")
            return {'status': 'error', 'message': 'Failed to update progress'}

    def get_recommended_resources(self, user_profile: Dict) -> List[Dict]:
        """Get AI-recommended resources based on user profile"""
        all_resources = self.get_all_resources()
        
        # Simple recommendation logic based on user's profession and interests
        profession = user_profile.get('profession', '').lower()
        recommended = []

        if 'developer' in profession or 'engineer' in profession:
            categories = ['Web Development', 'Computer Science', 'AI']
        elif 'data' in profession:
            categories = ['Data Science', 'AI', 'Computer Science']
        elif 'design' in profession:
            categories = ['Design', 'Web Development']
        elif 'security' in profession or 'cyber' in profession:
            categories = ['Cybersecurity', 'Computer Science']
        else:
            categories = ['Computer Science', 'Web Development', 'Data Science']

        for resource in all_resources:
            if resource['category'] in categories:
                recommended.append(resource)

        # Sort by rating and return top 10
        recommended.sort(key=lambda x: x['rating'], reverse=True)
        return recommended[:10]

    def get_resources_for_learning_path(self, learning_goals: List[str]) -> List[Dict]:
        """Get resources specifically for learning path goals"""
        all_resources = self.get_all_resources()
        relevant_resources = []
        
        for goal in learning_goals:
            goal_lower = goal.lower()
            for resource in all_resources:
                # Check if resource is relevant to the learning goal
                if (goal_lower in resource['title'].lower() or 
                    goal_lower in resource['description'].lower() or
                    any(goal_lower in tag.lower() for tag in resource['tags'])):
                    
                    # Only add high-quality resources (rating >= 4.0)
                    if resource['rating'] >= 4.0:
                        resource['relevance_score'] = self._calculate_relevance(resource, goal)
                        relevant_resources.append(resource)
        
        # Remove duplicates and sort by relevance and rating
        seen_ids = set()
        unique_resources = []
        for resource in relevant_resources:
            if resource['id'] not in seen_ids:
                seen_ids.add(resource['id'])
                unique_resources.append(resource)
        
        # Sort by relevance score and rating
        unique_resources.sort(key=lambda x: (x.get('relevance_score', 0), x['rating']), reverse=True)
        return unique_resources[:15]  # Limit to top 15 resources

    def _calculate_relevance(self, resource: Dict, goal: str) -> float:
        """Calculate relevance score for a resource based on learning goal"""
        score = 0.0
        goal_lower = goal.lower()
        
        # Title match (highest weight)
        if goal_lower in resource['title'].lower():
            score += 3.0
        
        # Description match
        if goal_lower in resource['description'].lower():
            score += 2.0
        
        # Tags match
        for tag in resource['tags']:
            if goal_lower in tag.lower():
                score += 1.5
        
        # Category match
        if goal_lower in resource['category'].lower():
            score += 1.0
        
        # Provider preference (trusted sources get bonus)
        trusted_providers = ['freecodecamp', 'mit', 'stanford', 'harvard', 'coursera', 'edx']
        if any(provider in resource['provider'].lower() for provider in trusted_providers):
            score += 0.5
        
        return score

    def add_resource_from_external(self, resource_data: Dict) -> Dict:
        """Add a resource fetched from external sources"""
        try:
            resource_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            
            # Read existing resources
            resources = []
            if os.path.exists(self.resources_file):
                with open(self.resources_file, 'r', encoding='utf-8') as file:
                    reader = csv.DictReader(file)
                    resources = list(reader)
            
            # Check if resource already exists (by URL)
            existing_resource = next((r for r in resources if r['url'] == resource_data.get('url', '')), None)
            if existing_resource:
                return {'status': 'exists', 'id': existing_resource['id']}
            
            # Add new resource
            new_resource = {
                'id': resource_id,
                'title': resource_data.get('title', ''),
                'description': resource_data.get('description', ''),
                'provider': resource_data.get('provider', 'External'),
                'category': resource_data.get('category', 'General'),
                'level': resource_data.get('level', 'Beginner'),
                'duration': resource_data.get('duration', ''),
                'url': resource_data.get('url', ''),
                'embed_url': resource_data.get('embed_url', ''),
                'thumbnail': resource_data.get('thumbnail', ''),
                'language': resource_data.get('language', 'English'),
                'tags': ','.join(resource_data.get('tags', [])),
                'rating': str(resource_data.get('rating', 4.0)),
                'created_at': created_at
            }
            
            resources.append(new_resource)
            
            # Write back to file
            with open(self.resources_file, 'w', newline='', encoding='utf-8') as file:
                fieldnames = ['id', 'title', 'description', 'provider', 'category', 'level',
                            'duration', 'url', 'embed_url', 'thumbnail', 'language',
                            'tags', 'rating', 'created_at']
                writer = csv.DictWriter(file, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(resources)
            
            return {'status': 'added', 'id': resource_id}
            
        except Exception as e:
            print(f"Error adding external resource: {e}")
            return {'status': 'error', 'message': str(e)}
