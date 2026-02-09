# FamilyPoints

FamilyPoints is a gamified application designed to help parents encourage good habits and faith in their children through a points and rewards system.

## Features
- **Parent Dashboard**: Manage children, create tasks, approve submissions, and handle reward redemptions.
- **Child Dashboard**: Gamified view with levels, badges, streaks, and a rewards store.
- **Task System**: Supports multiple categories (Faith, School, Home, Kindness).
- **Evidence Upload**: Children can upload photos or documents as proof of task completion. Includes a custom in-app camera for mobile and desktop devices.
- **Multiple File Support**: Submissions can include multiple evidence files (images or PDFs).
- **Enhanced Review**: Parents can view all attached evidence directly within the dashboard before approving tasks.
- **Rewards**: Redeem points for privileges, money, or gifts.
- **Professional UI**: Built with React, TypeScript, and Material UI.

## Tech Stack
- **Backend**: Python (FastAPI), SQLAlchemy, PostgreSQL.
- **Frontend**: React, TypeScript, Vite, Material UI.
- **Infrastructure**: Docker, Docker Compose, Nginx.
- **Media**: Custom Camera Interface (using MediaDevices API), File Upload Handling (python-multipart).

## Getting Started

### Prerequisites
- Docker & Docker Compose

### Running with Docker (Recommended)
This will set up the Database, Backend API, and Frontend web server.

```bash
docker-compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)

### Local Development
**Backend**
```bash
cd backend
pip install -r requirements.txt
# Run migrations if database is fresh or updated
python migrate_evidence.py 
uvicorn app.main:app --reload
```
**Frontend**
```bash
cd frontend
npm install
npm run dev
```

## Default Accounts
The system is seeded with:
- **Parent**: `parent@example.com` / `password`
- **Child**: `selina` / `password`

## Project Structure
- `backend/app/api`: API Routers (Auth, Children, Tasks, Rewards, Settings, Submissions, Uploads).
- `backend/app/models`: SQLAlchemy Database Models (including new SubmissionEvidence).
- `backend/app/services`: Business logic for Badges and Streaks.
- `frontend/src/pages`: React Pages (ParentDashboard, ChildDashboard).
- `frontend/src/components`: UI Components.
