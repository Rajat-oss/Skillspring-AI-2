# Gmail Integration Setup Instructions

## 🔧 Google Cloud Console Setup Required

To enable real-time Gmail data fetching, you need to configure the Google Cloud Console:

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Select your project or create a new one

### 2. Enable APIs
Enable these APIs in your project:
- **Gmail API**
- **Google+ API** (for profile info)

### 3. Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name: `SkillSpring Application Tracker`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### 4. Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Application type: **Web application**
4. Name: `SkillSpring Gmail Integration`
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (for production)

### 5. Test Users (During Development)
1. Go to **OAuth consent screen > Test users**
2. Add your Gmail address as a test user
3. This allows you to test the integration

## 🚀 Current Implementation Features

### Real-Time Gmail Integration
- ✅ Fetches emails from last 1 month
- ✅ Uses Gemini AI for intelligent parsing
- ✅ Categorizes into Jobs, Internships, Hackathons
- ✅ Extracts company, role, status automatically
- ✅ Shows confidence scores for AI analysis
- ✅ Real-time platform detection

### AI-Powered Analysis
- ✅ Gemini AI analyzes email content
- ✅ Determines application type and status
- ✅ Generates career insights
- ✅ Confidence scoring for accuracy

### Security Features
- ✅ 2-step OAuth verification
- ✅ Read-only Gmail access
- ✅ Secure token handling
- ✅ No data storage of email content

## 🔍 How It Works

1. **User Authentication**: Secure Gmail OAuth login
2. **Email Scanning**: Fetches emails from last month with application keywords
3. **AI Analysis**: Gemini AI analyzes each email for:
   - Application type (job/internship/hackathon)
   - Company name
   - Role/position
   - Application status
   - Platform used
4. **Categorization**: Separates into different tabs
5. **Insights**: AI generates career recommendations

## 📊 Supported Platforms
- LinkedIn
- Unstop
- Internshala
- Devfolio
- Naukri
- Indeed
- Glassdoor
- AngelList/Wellfound
- And many more (AI detects automatically)

## 🛠️ Testing
1. Complete Google Cloud setup above
2. Run: `npm run dev`
3. Go to Applications tab
4. Click "Connect Gmail Account"
5. Authorize with your Gmail
6. View your real applications!

## 🔒 Privacy & Security
- Only reads emails (no write access)
- Processes data locally
- No permanent storage of email content
- Secure OAuth 2.0 implementation
- User can revoke access anytime

The system is now ready to fetch and analyze your real Gmail data with AI-powered intelligence!