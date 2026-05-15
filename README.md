# ExamPulse
### Mobile-Based Exam Notification and Scheduling System

> Final Year Undergraduate Project — Lagos State University  
> Student: Osinuga Eniola Ifeoluwa | Matric: 220591260  
> Supervisor: Professor Rahman

---

## Overview

ExamPulse is a two-part software system consisting of a React Native student mobile app and a Next.js admin web dashboard, connected through a Node.js/Express backend and Firebase. The system replaces physical notice boards and WhatsApp broadcasts with real-time push notifications and an always-accessible personalised exam timetable.

Students upload their official university course registration form PDF — AI reads it and extracts their registered courses automatically. Administrators upload the faculty examination timetable PDF — AI extracts all exam records at once. When any exam is created, updated, or deleted, affected students receive an instant push notification. Automated reminders are sent 24 hours and 2 hours before each exam.

---

## Research Gaps Addressed

- Existing systems notify by department/level, ignoring cross-faculty and elective course registration
- Existing systems require manual data entry for both exam schedules and student course lists
- No existing system handles AI-assisted ingestion from official university documents
- No existing system sends automated time-based exam reminders

---

## Project Structure

```
exampulse/
├── mobile/          # React Native student app (Expo)
├── admin/           # Next.js admin dashboard (TypeScript + Tailwind)
└── backend/         # Node.js / Express API server
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Mobile app | React Native + Expo | Student iOS/Android app |
| Admin dashboard | Next.js + TypeScript + Tailwind CSS | Admin web interface |
| Backend | Node.js + Express | REST API + Firebase listeners |
| Database | Firebase Realtime Database | Live data sync |
| Authentication | Firebase Auth | Login, registration, password reset |
| Push notifications | Expo FCM proxy | Device notification delivery |
| AI document parsing | Google Gemini AI API | PDF/image extraction |
| Reminder scheduling | node-cron | 24hr and 2hr exam reminders |
| Offline cache | AsyncStorage | Local timetable storage |

---

## Features

### Student Mobile App
- Welcome, login, and registration screens with modern design system
- Three-step registration with AI course form parser (PDF upload → AI extracts courses → confirm)
- Personalised timetable filtered by registered course codes (supports cross-faculty and elective courses)
- Next exam hero card with live countdown timer
- Exam detail screen (date, time, venue, instructions, required materials)
- Push notifications — instant delivery when exams are created, updated, or deleted
- Automated reminders — 24 hours and 2 hours before each exam
- Notification history with unread indicators and clear all
- Offline mode — AsyncStorage caches last-fetched timetable
- Profile screen showing academic info and registered course list
- Forgot password via Firebase email reset
- Bottom tab navigation (Timetable, Notifications, Profile)

### Admin Web Dashboard
- Secure login with forgot password support
- Dashboard overview with live exam count and recent activity
- Full CRUD for exam records (create, read, update, delete)
- AI timetable import — upload any faculty timetable PDF, AI extracts all exams, admin reviews and confirms
- Progress indicator during AI extraction
- Bulk import sends one consolidated notification instead of per-exam notifications
- Exam list with edit and delete per record
- Sidebar navigation (Overview, Exam Schedule, Notifications)

### Backend
- Firebase Realtime Database listeners for real-time exam change detection
- Notification matching by registered course code (not department/level)
- Fallback to department/level matching for students without uploaded course forms
- Expo push notification proxy integration
- node-cron scheduler checking every 15 minutes for upcoming exams
- Google Gemini AI API integration for PDF/image document parsing
- Firebase Admin SDK with service account credentials

---

## Prerequisites

- Node.js v18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone
- Firebase project (Realtime Database + Authentication enabled)
- Google Gemini API key (aistudio.google.com)
- Git

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/exampulse.git
cd exampulse
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file:

```
PORT=3000
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
GEMINI_API_KEY=your_gemini_api_key
```

Place your Firebase service account key at `backend/serviceAccountKey.json` (download from Firebase Console → Project Settings → Service Accounts).

Start the backend:

```bash
node index.js
```

### 3. Mobile app setup

```bash
cd mobile
npm install
```

Open `mobile/config/firebase.js` and replace the config values with your Firebase project credentials.

Find your Mac's local IP address:

```bash
ipconfig getifaddr en0
```

Open `mobile/utils/parseDocument.js` and replace `YOUR_MAC_IP` with that IP address.

Start the app:

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone (must be on the same WiFi network).

### 4. Admin dashboard setup

```bash
cd admin
npm install
```

Create `admin/.env.local`:

```
GEMINI_API_KEY=your_gemini_api_key
```

Open `admin/src/lib/firebase.ts` and replace the config values with your Firebase project credentials.

Start the dashboard:

```bash
npm run dev
```

Open `http://localhost:3001` in your browser. Create an admin account manually in Firebase Console → Authentication → Users before logging in.

---

## Firebase Configuration

### Realtime Database Security Rules

```json
{
  "rules": {
    "users": {
      ".read": true,
      "$uid": {
        ".write": "$uid === auth.uid"
      }
    },
    "exams": {
      ".read": "auth !== null",
      ".write": "auth !== null"
    },
    "notifications": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "auth !== null"
      }
    },
    "connection_test": {
      ".read": true,
      ".write": "auth !== null"
    }
  }
}
```

---

## Database Structure

```
Firebase Realtime Database
├── users/
│   └── {uid}/
│       ├── fullName
│       ├── matricNumber
│       ├── email
│       ├── department
│       ├── level
│       ├── semester
│       ├── session
│       ├── role          ("student" | "admin")
│       ├── fcmToken
│       ├── createdAt
│       └── courses/
│           └── [{courseCode, courseTitle, units, status}]
├── exams/
│   └── {examId}/
│       ├── courseCode
│       ├── courseTitle
│       ├── date          (YYYY-MM-DD)
│       ├── startTime     (HH:MM)
│       ├── endTime       (HH:MM)
│       ├── venue
│       ├── department
│       ├── level
│       ├── instructions
│       ├── bulkImport    (boolean)
│       └── createdAt
└── notifications/
    └── {uid}/
        └── {notifId}/
            ├── title
            ├── body
            ├── examData
            ├── timestamp
            └── read
```

---

## How Push Notifications Work

```
Admin saves exam
       ↓
Firebase child_added / child_changed / child_removed fires
       ↓
Backend queries users — matches by registered courseCode
       ↓
Collects Expo push tokens for matching students
       ↓
Sends payload to https://exp.host/--/api/v2/push/send
       ↓
Expo proxy forwards to FCM
       ↓
FCM delivers to student device (even if app is closed)
       ↓
Notification logged to Firebase notifications/{uid}
```

For bulk imports, one consolidated notification is sent instead of one per exam.

Reminder notifications follow the same path, triggered by node-cron every 15 minutes checking for exams within 24 hours or 2 hours.

---

## AI Document Parsing

### Student course form
Student uploads their official university course registration PDF → backend converts to base64 → sends to Gemini AI with extraction prompt → AI returns JSON with student name, matric number, department, level, semester, session, and full course list → student confirms → saved to Firebase.

### Admin exam timetable
Admin uploads faculty exam timetable PDF or image → backend sends to Gemini AI → AI extracts all exam records with dates, times, venues, departments, and levels → admin reviews and can edit individual records → admin selects which to save → all saved at once with one consolidated student notification.

---

## Notification Logic

Students are matched to exams by their **registered course codes**, not by department and level. This correctly handles:
- Cross-faculty course registration
- Elective courses from other departments
- Students from the same department but with different course selections

Students without an uploaded course form fall back to department and level matching.

---

## Project Objectives and Success Metrics

| Objective | Target | Status |
|---|---|---|
| Notification delivery time | < 5 seconds | ✅ Achieved |
| System Usability Scale score | ≥ 75 / 100 | Pending UAT |
| Notification delivery success rate | ≥ 95% | Pending UAT |

---

## Screens

### Mobile (React Native)
- Welcome screen
- Login screen
- Registration screen (3-step with AI course form upload)
- Timetable screen (hero card + upcoming/past table)
- Exam detail screen (countdown, schedule, venue, instructions, materials)
- Notifications screen (history, unread indicators, clear all)
- Profile screen (academic info, registered courses, sign out)

### Admin (Next.js)
- Login page
- Dashboard overview (live stats, recent exams, quick actions)
- Exam schedule list (with edit and delete)
- Create exam form
- Edit exam form
- AI timetable import page (upload, extract, review, save)
- Notifications page

---

## Known Limitations

- AI parsing accuracy depends on document quality. Poorly scanned or non-standard timetable formats may require manual correction.
- Students who register additional courses after uploading their form must update their profile manually in a future version.
- Offline mode cannot be tested in Expo Go (requires a standalone APK build).
- The backend must be running locally during development — a deployed backend is required for production use.
- CBT batch scheduling is not currently supported. Identified as future work.

---

## Future Work

- Cross-faculty course update flow (re-upload course form each semester)
- CBT batch assignment with automatic student allocation by centre capacity
- Admin-managed course catalogue
- Deployed backend (e.g. Railway or Render)
- Standalone APK/IPA production build
- Update registered courses from Profile screen

---

## License

This project was developed as a final year undergraduate project at Lagos State University. All rights reserved.
