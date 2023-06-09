@echo off

set proj_name=research_mailer

echo Creating Firebase project %proj_name%
firebase projects:create --display-name=%proj_name% --name=%proj_name%

echo Initializing Firebase in the current directory
firebase use --add %proj_name%

echo Setting up Firestore collection "users"
firebase firestore:rules:write --allow write --collection users

echo Deploying Firebase function
firebase deploy --only functions

echo Building Web Project
flutter build web

echo Running Project
flutter run -d chrome