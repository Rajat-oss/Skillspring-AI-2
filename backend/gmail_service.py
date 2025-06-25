
import os
import json
import re
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import email
from email.mime.text import MIMEText
import base64
import csv
try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError:
    print("Google API libraries not installed. Using mock data for demo.")

class GmailApplicationTracker:
    def __init__(self):
        self.scopes = ['https://www.googleapis.com/auth/gmail.readonly']
        self.credentials_file = "data/gmail_credentials.json"
        self.token_file = "data/gmail_token.json"
        self.applications_file = "data/tracked_applications.csv"
        self.init_files()

    def init_files(self):
        """Initialize required files"""
        os.makedirs("data", exist_ok=True)
        
        if not os.path.exists(self.applications_file):
            with open(self.applications_file, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow([
                    'id', 'user_id', 'title', 'company', 'platform', 'type', 'status',
                    'applied_date', 'last_updated', 'email_subject', 'location', 'salary',
                    'deadline', 'description', 'application_url', 'email_id'
                ])

    def get_authorization_url(self, user_id: str) -> str:
        """Generate OAuth authorization URL"""
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": ["http://localhost:8000/gmail/callback"]
                    }
                },
                scopes=self.scopes
            )
            flow.redirect_uri = "http://localhost:8000/gmail/callback"
            
            authorization_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                state=user_id
            )
            
            return authorization_url
        except Exception as e:
            print(f"Error generating authorization URL: {e}")
            return ""

    def handle_oauth_callback(self, authorization_code: str, user_id: str) -> Dict:
        """Handle OAuth callback and store credentials"""
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": ["http://localhost:8000/gmail/callback"]
                    }
                },
                scopes=self.scopes
            )
            flow.redirect_uri = "http://localhost:8000/gmail/callback"
            
            flow.fetch_token(code=authorization_code)
            credentials = flow.credentials
            
            # Store credentials
            token_data = {
                'token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': credentials.scopes,
                'user_id': user_id
            }
            
            with open(f"data/gmail_token_{user_id}.json", 'w') as token_file:
                json.dump(token_data, token_file)
            
            return {'status': 'success', 'message': 'Gmail connected successfully'}
        except Exception as e:
            print(f"Error handling OAuth callback: {e}")
            return {'status': 'error', 'message': str(e)}

    def get_gmail_service(self, user_id: str):
        """Get authenticated Gmail service"""
        try:
            token_file = f"data/gmail_token_{user_id}.json"
            if not os.path.exists(token_file):
                return None
            
            with open(token_file, 'r') as f:
                token_data = json.load(f)
            
            credentials = Credentials(
                token=token_data['token'],
                refresh_token=token_data['refresh_token'],
                token_uri=token_data['token_uri'],
                client_id=token_data['client_id'],
                client_secret=token_data['client_secret'],
                scopes=token_data['scopes']
            )
            
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                # Update stored token
                token_data['token'] = credentials.token
                with open(token_file, 'w') as f:
                    json.dump(token_data, f)
            
            return build('gmail', 'v1', credentials=credentials)
        except Exception as e:
            print(f"Error getting Gmail service: {e}")
            return None

    def scan_emails_for_applications(self, user_id: str, days_back: int = 30) -> List[Dict]:
        """Scan Gmail for application-related emails from last month"""
        service = self.get_gmail_service(user_id)
        if not service:
            return []

        try:
            # Calculate date range for last month from current date
            since_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y/%m/%d')
            
            # Search queries for different platforms and keywords
            search_queries = [
                f'from:(unstop.com OR dare2compete.com OR devfolio.co OR internshala.com OR naukri.com OR linkedin.com) after:{since_date}',
                f'subject:(application OR registration OR selected OR rejected OR interview OR hackathon OR internship OR job) after:{since_date}',
                f'body:(congratulations OR unfortunately OR application status OR interview scheduled) after:{since_date}'
            ]
            
            all_applications = []
            processed_emails = set()
            
            for query in search_queries:
                try:
                    # Fetch messages with reasonable limit
                    results = service.users().messages().list(userId='me', q=query, maxResults=100).execute()
                    messages = results.get('messages', [])
                    
                    # Process messages from last month
                    for message in messages[:50]:  # Limit to prevent timeout
                        if message['id'] in processed_emails:
                            continue
                        
                        processed_emails.add(message['id'])
                        
                        msg = service.users().messages().get(userId='me', id=message['id']).execute()
                        application = self.parse_email_for_application(msg, user_id)
                        
                        if application:
                            all_applications.append(application)
                
                except HttpError as e:
                    print(f"Error searching emails: {e}")
                    continue
            
            # Save to CSV and return
            self.save_applications(all_applications)
            return all_applications
            
        except Exception as e:
            print(f"Error scanning emails: {e}")
            return []

    def parse_email_for_application(self, message: Dict, user_id: str) -> Optional[Dict]:
        """Parse email message to extract application information"""
        try:
            headers = message['payload'].get('headers', [])
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), '')
            date_received = next((h['value'] for h in headers if h['name'] == 'Date'), '')
            
            # Get email body
            body = self.extract_email_body(message['payload'])
            
            # Platform detection
            platform = self.detect_platform(sender, body)
            if not platform:
                return None
            
            # Extract application details
            application_info = self.extract_application_info(subject, body, platform)
            if not application_info:
                return None
            
            # Parse date
            try:
                parsed_date = datetime.strptime(date_received.split(' +')[0], '%a, %d %b %Y %H:%M:%S')
                applied_date = parsed_date.isoformat()
            except:
                applied_date = datetime.now().isoformat()
            
            return {
                'id': f"{user_id}_{message['id']}",
                'user_id': user_id,
                'title': application_info['title'],
                'company': application_info['company'],
                'platform': platform,
                'type': application_info['type'],
                'status': application_info['status'],
                'applied_date': applied_date,
                'last_updated': datetime.now().isoformat(),
                'email_subject': subject,
                'location': application_info.get('location', ''),
                'salary': application_info.get('salary', ''),
                'deadline': application_info.get('deadline', ''),
                'description': application_info.get('description', ''),
                'application_url': application_info.get('url', ''),
                'email_id': message['id']
            }
            
        except Exception as e:
            print(f"Error parsing email: {e}")
            return None

    def extract_email_body(self, payload: Dict) -> str:
        """Extract text from email payload"""
        body = ""
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    data = part['body']['data']
                    body += base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
        elif payload['mimeType'] == 'text/plain':
            data = payload['body']['data']
            body = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
        
        return body

    def detect_platform(self, sender: str, body: str) -> Optional[str]:
        """Detect platform from email sender and content"""
        sender_lower = sender.lower()
        body_lower = body.lower()
        
        platforms = {
            'unstop': ['unstop.com', 'unstop'],
            'internshala': ['internshala.com', 'internshala'],
            'devfolio': ['devfolio.co', 'devfolio'],
            'dare2compete': ['dare2compete.com', 'd2c'],
            'linkedin': ['linkedin.com', 'linkedin'],
            'naukri': ['naukri.com', 'naukri'],
            'hackerearth': ['hackerearth.com', 'hackerearth'],
            'hackerrank': ['hackerrank.com', 'hackerrank'],
            'codechef': ['codechef.com', 'codechef']
        }
        
        for platform, keywords in platforms.items():
            if any(keyword in sender_lower or keyword in body_lower for keyword in keywords):
                return platform
        
        return None

    def extract_application_info(self, subject: str, body: str, platform: str) -> Optional[Dict]:
        """Extract application information from email content"""
        try:
            subject_lower = subject.lower()
            body_lower = body.lower()
            
            # Determine application type
            app_type = 'job'
            if any(keyword in subject_lower or keyword in body_lower for keyword in ['internship', 'intern']):
                app_type = 'internship'
            elif any(keyword in subject_lower or keyword in body_lower for keyword in ['hackathon', 'hack', 'competition']):
                app_type = 'hackathon'
            
            # Determine status
            status = 'applied'
            if any(keyword in subject_lower for keyword in ['selected', 'congratulations', 'accepted']):
                status = 'selected'
            elif any(keyword in subject_lower for keyword in ['rejected', 'unfortunately', 'not selected']):
                status = 'rejected'
            elif any(keyword in subject_lower for keyword in ['interview', 'round']):
                status = 'interview_scheduled'
            elif any(keyword in subject_lower for keyword in ['shortlist']):
                status = 'shortlisted'
            
            # Extract title and company
            title = self.extract_position_title(subject, body)
            company = self.extract_company_name(subject, body, platform)
            
            if not title or not company:
                return None
            
            return {
                'title': title,
                'company': company,
                'type': app_type,
                'status': status,
                'description': body[:500] if body else '',
            }
            
        except Exception as e:
            print(f"Error extracting application info: {e}")
            return None

    def extract_position_title(self, subject: str, body: str) -> str:
        """Extract job/position title from email"""
        # Common patterns for job titles in subject lines
        patterns = [
            r'(?:application for|applied for|regarding)\s+([^-\n]+?)(?:\s+at|\s+role|\s+position|$)',
            r'([^-\n]+?)\s+(?:role|position|job|internship)',
            r'(?:for|regarding)\s+([^-\n]+?)(?:\s+at|$)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, subject, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                if len(title) > 5 and len(title) < 100:
                    return title
        
        # Fallback: use subject line cleaned up
        return re.sub(r'(application|applied|regarding|for|confirmation|registration)', '', subject, flags=re.IGNORECASE).strip()[:100]

    def extract_company_name(self, subject: str, body: str, platform: str) -> str:
        """Extract company name from email"""
        # Platform-specific extraction
        if platform == 'internshala':
            match = re.search(r'at\s+([^-\n]+?)(?:\s+has|$)', subject, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Generic patterns
        patterns = [
            r'at\s+([^-\n]+?)(?:\s+for|\s+has|$)',
            r'from\s+([^-\n]+?)(?:\s+for|$)',
            r'with\s+([^-\n]+?)(?:\s+for|$)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, subject, re.IGNORECASE)
            if match:
                company = match.group(1).strip()
                if len(company) > 2 and len(company) < 50:
                    return company
        
        return platform.title()

    def save_applications(self, applications: List[Dict]):
        """Save applications to CSV file"""
        if not applications:
            return
        
        try:
            # Read existing applications
            existing_apps = []
            if os.path.exists(self.applications_file):
                with open(self.applications_file, 'r', encoding='utf-8') as file:
                    reader = csv.DictReader(file)
                    existing_apps = list(reader)
            
            # Merge with new applications (avoid duplicates)
            existing_ids = {app['id'] for app in existing_apps}
            new_apps = [app for app in applications if app['id'] not in existing_ids]
            
            all_apps = existing_apps + new_apps
            
            # Write back to file
            if all_apps:
                with open(self.applications_file, 'w', newline='', encoding='utf-8') as file:
                    fieldnames = [
                        'id', 'user_id', 'title', 'company', 'platform', 'type', 'status',
                        'applied_date', 'last_updated', 'email_subject', 'location', 'salary',
                        'deadline', 'description', 'application_url', 'email_id'
                    ]
                    writer = csv.DictWriter(file, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(all_apps)
            
        except Exception as e:
            print(f"Error saving applications: {e}")

    def get_user_applications(self, user_id: str) -> List[Dict]:
        """Get all applications for a user"""
        applications = []
        try:
            if not os.path.exists(self.applications_file):
                return applications
            
            with open(self.applications_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                applications = [row for row in reader if row['user_id'] == user_id]
            
        except Exception as e:
            print(f"Error reading applications: {e}")
        
        return applications

    def get_application_stats(self, user_id: str) -> Dict:
        """Get application statistics for a user"""
        applications = self.get_user_applications(user_id)
        
        total = len(applications)
        applied = len([app for app in applications if app['status'] == 'applied'])
        selected = len([app for app in applications if app['status'] == 'selected'])
        rejected = len([app for app in applications if app['status'] == 'rejected'])
        pending = len([app for app in applications if app['status'] in ['pending', 'shortlisted', 'interview_scheduled']])
        
        response_rate = round((selected + rejected) / total * 100, 1) if total > 0 else 0
        
        return {
            'total': total,
            'applied': applied,
            'selected': selected,
            'rejected': rejected,
            'pending': pending,
            'response_rate': response_rate
        }

    def is_connected(self, user_id: str) -> bool:
        """Check if user has connected Gmail"""
        token_file = f"data/gmail_token_{user_id}.json"
        return os.path.exists(token_file)
    
    async def sync_user_applications(self, user_id: str, user_email: str) -> List[Dict]:
        """Sync applications for a specific user"""
        try:
            # Check if Gmail is connected
            if not self.is_connected(user_id):
                # Return mock data for demo purposes
                return self.get_mock_applications(user_id)
            
            # Scan emails for applications
            applications = self.scan_emails_for_applications(user_id, days_back=60)
            return applications
        except Exception as e:
            print(f"Error syncing applications for user {user_id}: {e}")
            # Return mock data as fallback
            return self.get_mock_applications(user_id)
    
    def get_mock_applications(self, user_id: str) -> List[Dict]:
        """Return mock applications for demo purposes"""
        from datetime import datetime, timedelta
        import random
        
        mock_applications = [
            {
                'id': f"{user_id}_mock_1",
                'user_id': user_id,
                'type': 'job',
                'company': 'TechCorp Inc.',
                'position': 'Frontend Developer',
                'status': 'applied',
                'date': (datetime.now() - timedelta(days=5)).isoformat(),
                'email_subject': 'Application Received - Frontend Developer Position',
                'created_at': datetime.now().isoformat()
            },
            {
                'id': f"{user_id}_mock_2",
                'user_id': user_id,
                'type': 'internship',
                'company': 'StartupXYZ',
                'position': 'Software Engineering Intern',
                'status': 'interview',
                'date': (datetime.now() - timedelta(days=10)).isoformat(),
                'email_subject': 'Interview Scheduled - Software Engineering Internship',
                'created_at': datetime.now().isoformat()
            },
            {
                'id': f"{user_id}_mock_3",
                'user_id': user_id,
                'type': 'hackathon',
                'company': 'HackFest 2024',
                'position': 'Web Development Challenge',
                'status': 'selected',
                'date': (datetime.now() - timedelta(days=15)).isoformat(),
                'email_subject': 'Congratulations! You are selected for HackFest 2024',
                'created_at': datetime.now().isoformat()
            },
            {
                'id': f"{user_id}_mock_4",
                'user_id': user_id,
                'type': 'job',
                'company': 'DataCorp',
                'position': 'Data Analyst',
                'status': 'rejected',
                'date': (datetime.now() - timedelta(days=20)).isoformat(),
                'email_subject': 'Update on your Data Analyst application',
                'created_at': datetime.now().isoformat()
            }
        ]
        
        return mock_applications
