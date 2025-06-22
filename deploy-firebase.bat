@echo off
echo Deploying Firebase Firestore rules...
firebase deploy --only firestore:rules --project skillbring-45956
echo Done!
pause