# Deploy Firestore Security Rules

To fix the Firebase permission errors, you need to deploy the Firestore security rules:

## Option 1: Using Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `skillbring-45956`
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the content from `firestore.rules`
5. Click **Publish**

## Option 2: Using Firebase CLI
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

## Current Rules Content
The `firestore.rules` file contains permissive rules for development. For production, you should restrict access based on authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gmail_auth/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId.replace('_', '.');
    }
    
    match /user_applications/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId.replace('_', '.');
    }
  }
}
```

## After Deploying Rules
The Firebase permission errors should be resolved and your Gmail applications API should work properly.