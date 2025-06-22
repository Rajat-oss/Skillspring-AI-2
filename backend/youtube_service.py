import os
import requests
import csv
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import json

class YouTubeService:
    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")
        self.base_url = "https://www.googleapis.com/youtube/v3"
        self.resources_file = "data/free_resources.csv"

        if not self.api_key:
            print("Warning: YouTube API key not found in environment variables")

    def search_educational_videos(self, query: str, category: str = "", max_results: int = 10) -> List[Dict]:
        """Search for educational videos on YouTube"""
        try:
            search_response = self.youtube.search().list(
                q=f"{query} tutorial education learning",
                part="snippet",
                type="video",
                maxResults=max_results * 2,  # Get more to filter better
                videoDuration="medium",  # Filter for substantial content
                videoDefinition="high",
                relevanceLanguage="en",
                safeSearch="strict"
            ).execute()

            videos = []
            video_ids = []

            for item in search_response.get('items', []):
                video_ids.append(item['id']['videoId'])

            # Get video statistics for trust scoring
            stats_response = self.youtube.videos().list(
                part="statistics,contentDetails",
                id=','.join(video_ids)
            ).execute()

            stats_dict = {}
            for item in stats_response.get('items', []):
                stats_dict[item['id']] = item

            for item in search_response.get('items', []):
                video_id = item['id']['videoId']
                snippet = item['snippet']
                stats = stats_dict.get(video_id, {}).get('statistics', {})
                content_details = stats_dict.get(video_id, {}).get('contentDetails', {})

                # Calculate community trust score
                trust_score = self._calculate_trust_score(stats, snippet)

                # Only include videos with decent trust scores (raised threshold)
                if trust_score >= 0.7:
                    # Parse duration
                    duration = self._parse_duration(content_details.get('duration', 'PT0M'))

                    # Skip very short videos (less than 5 minutes for educational content)
                    duration_minutes = self._duration_to_minutes(duration)
                    if duration_minutes < 5:
                        continue

                    videos.append({
                        'id': f"youtube_{video_id}",
                        'title': self._clean_title(snippet['title']),
                        'description': snippet['description'][:300] + "..." if len(snippet['description']) > 300 else snippet['description'],
                        'provider': snippet['channelTitle'],
                        'category': category or self.categorize_content(snippet['title'] + " " + snippet['description']),
                        'level': self._determine_level(snippet['title'], snippet['description']),
                        'duration': duration,
                        'url': f"https://www.youtube.com/watch?v={video_id}",
                        'embed_url': f"https://www.youtube.com/embed/{video_id}",
                        'thumbnail': snippet['thumbnails'].get('high', {}).get('url', ''),
                        'language': 'English',
                        'tags': self._extract_tags(snippet['title'], snippet['description']),
                        'rating': min(5.0, trust_score * 5),  # Convert to 5-star rating
                        'view_count': int(stats.get('viewCount', 0)),
                        'like_count': int(stats.get('likeCount', 0)),
                        'comment_count': int(stats.get('commentCount', 0)),
                        'trust_score': trust_score,
                        'created_at': snippet['publishedAt']
                    })

            # Sort by trust score, engagement, and relevance
            videos.sort(key=lambda x: (x['trust_score'], x['view_count'], x['like_count']), reverse=True)
            return videos[:max_results]  # Return only requested amount

        except Exception as e:
            print(f"Error searching YouTube: {e}")
            return []

    def _duration_to_minutes(self, duration_str: str) -> int:
        """Convert duration string to minutes"""
        try:
            if 'H' in duration_str:
                hours = int(duration_str.split('H')[0])
                minutes_part = duration_str.split('H')[1] if 'M' in duration_str else '0M'
                minutes = int(minutes_part.replace('M', '')) if 'M' in minutes_part else 0
                return hours * 60 + minutes
            elif 'M' in duration_str:
                return int(duration_str.replace('M', ''))
            else:
                return 0
        except:
            return 0

    def search_for_learning_goals(self, learning_goals: List[str], max_per_goal: int = 5) -> List[Dict]:
        """Search for videos specifically matching learning goals"""
        all_videos = []

        for goal in learning_goals:
            # Create more specific search queries
            search_queries = [
                f"{goal} complete tutorial",
                f"{goal} beginner guide",
                f"{goal} step by step",
                f"learn {goal} from scratch"
            ]

            goal_videos = []
            for query in search_queries:
                videos = self.search_educational_videos(query, max_results=3)
                goal_videos.extend(videos)

            # Remove duplicates and get best videos for this goal
            seen_ids = set()
            unique_videos = []
            for video in goal_videos:
                if video['id'] not in seen_ids:
                    seen_ids.add(video['id'])
                    video['learning_goal'] = goal  # Tag with the learning goal
                    unique_videos.append(video)

            # Sort and take top videos for this goal
            unique_videos.sort(key=lambda x: x['trust_score'], reverse=True)
            all_videos.extend(unique_videos[:max_per_goal])

        return all_videos

    def get_video_details(self, video_id: str) -> Dict:
        """Get additional video details"""
        try:
            params = {
                'part': 'contentDetails,statistics',
                'id': video_id,
                'key': self.api_key
            }

            response = requests.get(f"{self.base_url}/videos", params=params)
            response.raise_for_status()

            data = response.json()

            if data.get('items'):
                item = data['items'][0]
                content_details = item.get('contentDetails', {})
                statistics = item.get('statistics', {})

                # Convert ISO 8601 duration to readable format
                duration = self.parse_duration(content_details.get('duration', ''))

                return {
                    'duration': duration,
                    'view_count': int(statistics.get('viewCount', 0)),
                    'like_count': int(statistics.get('likeCount', 0))
                }

        except Exception as e:
            print(f"Error getting video details: {e}")

        return {}

    def parse_duration(self, duration: str) -> str:
        """Parse ISO 8601 duration to readable format"""
        try:
            import re

            # Parse PT1H2M3S format
            match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
            if match:
                hours, minutes, seconds = match.groups()

                parts = []
                if hours:
                    parts.append(f"{hours}h")
                if minutes:
                    parts.append(f"{minutes}m")
                if seconds and not hours:  # Only show seconds if no hours
                    parts.append(f"{seconds}s")

                return " ".join(parts) if parts else "Unknown"

        except Exception:
            pass

        return "Unknown"

    def determine_level(self, title: str, description: str) -> str:
        """Determine difficulty level based on title and description"""
        text = (title + " " + description).lower()

        if any(word in text for word in ['beginner', 'intro', 'basic', 'fundamentals', 'getting started', 'tutorial']):
            return 'Beginner'
        elif any(word in text for word in ['advanced', 'expert', 'master', 'deep dive', 'professional']):
            return 'Advanced'
        else:
            return 'Intermediate'

    def extract_tags(self, title: str, description: str, query: str) -> List[str]:
        """Extract relevant tags from video content"""
        text = (title + " " + description).lower()

        # Common tech tags
        tech_tags = [
            'javascript', 'python', 'react', 'node.js', 'html', 'css', 'typescript',
            'angular', 'vue', 'django', 'flask', 'express', 'mongodb', 'sql',
            'aws', 'docker', 'kubernetes', 'git', 'linux', 'machine learning',
            'data science', 'ai', 'tensorflow', 'pytorch', 'pandas', 'numpy'
        ]

        found_tags = [tag for tag in tech_tags if tag in text]

        # Add query as tag
        if query.lower() not in found_tags:
            found_tags.append(query.lower())

        return found_tags[:8]  # Limit to 8 tags

    def get_trending_educational_content(self) -> List[Dict]:
        """Get trending educational content from popular channels"""
        educational_channels = [
            'UC8butISFwT-Wl7EV0hUK0BQ',  # freeCodeCamp
            'UCWv7vMbMWH4-V0ZXdmDpPBA',  # Programming with Mosh
            'UC4xKdmAXFh4ACyhpiQ_3qBw',  # Academind
            'UCFbNIlppjAuEX4znoulh0Cw',  # Web Dev Simplified
            'UCRQhZGXC0WK85YRXl7nGX0w'   # Traversy Media
        ]

        all_videos = []

        for channel_id in educational_channels:
            try:
                # Get recent uploads from channel
                params = {
                    'part': 'snippet',
                    'channelId': channel_id,
                    'maxResults': 5,
                    'order': 'date',
                    'type': 'video',
                    'publishedAfter': (datetime.utcnow() - timedelta(days=30)).isoformat() + 'Z',
                    'key': self.api_key
                }

                response = requests.get(f"{self.base_url}/search", params=params)
                response.raise_for_status()

                data = response.json()

                for item in data.get('items', []):
                    video_id = item['id']['videoId']
                    snippet = item['snippet']

                    video_data = {
                        'id': f"yt_trending_{video_id}",
                        'title': snippet['title'],
                        'description': snippet['description'][:200] + "..." if len(snippet['description']) > 200 else snippet['description'],
                        'provider': snippet['channelTitle'],
                        'category': self.categorize_content(snippet['title']),
                        'level': self.determine_level(snippet['title'], snippet['description']),
                        'duration': 'Unknown',
                        'url': f"https://www.youtube.com/watch?v={video_id}",
                        'embed_url': f"https://www.youtube.com/embed/{video_id}",
                        'thumbnail': snippet['thumbnails']['high']['url'],
                        'language': 'English',
                        'tags': self.extract_tags(snippet['title'], snippet['description'], ''),
                        'rating': 4.7,
                        'created_at': datetime.utcnow().isoformat(),
                        'trending': True
                    }

                    all_videos.append(video_data)

            except Exception as e:
                print(f"Error getting trending content from channel {channel_id}: {e}")

        return all_videos

    def categorize_content(self, title: str) -> str:
        """Categorize content based on title"""
        title_lower = title.lower()

        if any(word in title_lower for word in ['react', 'vue', 'angular', 'javascript', 'html', 'css', 'web']):
            return 'Web Development'
        elif any(word in title_lower for word in ['python', 'data', 'pandas', 'numpy', 'analysis']):
            return 'Data Science'
        elif any(word in title_lower for word in ['machine learning', 'ai', 'neural', 'deep learning']):
            return 'AI'
        elif any(word in title_lower for word in ['security', 'hacking', 'cyber']):
            return 'Cybersecurity'
        elif any(word in title_lower for word in ['design', 'ui', 'ux', 'figma']):
            return 'Design'
        elif any(word in title_lower for word in ['mobile', 'android', 'ios', 'flutter', 'react native']):
            return 'Mobile Development'
        else:
            return 'Computer Science'

    def update_resources_with_youtube_content(self):
        """Update resources database with fresh YouTube content"""
        try:
            categories = {
                'Web Development': ['javascript tutorial', 'react course', 'html css', 'web development'],
                'Data Science': ['python data science', 'machine learning', 'pandas tutorial', 'data analysis'],
                'AI': ['artificial intelligence', 'deep learning', 'neural networks', 'tensorflow'],
                'Computer Science': ['algorithms', 'data structures', 'programming fundamentals', 'computer science'],
                'Cybersecurity': ['cybersecurity', 'ethical hacking', 'network security', 'information security'],
                'Design': ['ui ux design', 'figma tutorial', 'graphic design', 'web design'],
                'Mobile Development': ['mobile app development', 'flutter', 'react native', 'android development']
            }

            all_new_resources = []

            # Get content for each category
            for category, queries in categories.items():
                for query in queries:
                    videos = self.search_educational_videos(query, category, max_results=5)
                    all_new_resources.extend(videos)

            # Get trending content
            trending_videos = self.get_trending_educational_content()
            all_new_resources.extend(trending_videos)

            # Remove duplicates based on video ID
            seen_ids = set()
            unique_resources = []
            for resource in all_new_resources:
                if resource['id'] not in seen_ids:
                    seen_ids.add(resource['id'])
                    unique_resources.append(resource)

            # Read existing resources
            existing_resources = []
            if os.path.exists(self.resources_file):
                with open(self.resources_file, 'r', encoding='utf-8') as file:
                    reader = csv.DictReader(file)
                    existing_resources = list(reader)

            # Filter out YouTube resources that are older than 30 days
            filtered_existing = [
                resource for resource in existing_resources 
                if not resource['id'].startswith('yt_') or 
                   (datetime.now() - datetime.fromisoformat(resource['created_at'])).days < 30
            ]

            # Add new resources
            for resource in unique_resources:
                # Check if resource already exists
                if not any(existing['id'] == resource['id'] for existing in filtered_existing):
                    filtered_existing.append(resource)

            # Write back to file
            if filtered_existing:
                with open(self.resources_file, 'w', newline='', encoding='utf-8') as file:
                    fieldnames = [
                        'id', 'title', 'description', 'provider', 'category', 'level',
                        'duration', 'url', 'embed_url', 'thumbnail', 'language',
                        'tags', 'rating', 'created_at'
                    ]
                    writer = csv.DictWriter(file, fieldnames=fieldnames)
                    writer.writeheader()

                    for resource in filtered_existing:
                        # Convert tags list to string for CSV
                        if isinstance(resource.get('tags'), list):
                            resource['tags'] = ','.join(resource['tags'])

                        # Only write required fields
                        row = {field: resource.get(field, '') for field in fieldnames}
                        writer.writerow(row)

            print(f"Updated resources with {len(unique_resources)} new YouTube videos")
            return len(unique_resources)

        except Exception as e:
            print(f"Error updating YouTube content: {e}")
            return 0