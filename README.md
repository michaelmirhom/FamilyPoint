# FamilyPoints

FamilyPoints is a gamified application designed to help parents encourage good habits and faith in their children through a points and rewards system.

## Features
- **Parent Dashboard**: Manage children, create tasks, approve submissions, and handle reward redemptions.
- **Child Dashboard**: Gamified view with levels, badges, streaks, and a rewards store.
- **Task System**: Supports multiple categories (Faith, School, Home, Kindness).
- **Rewards**: Redeem points for privileges, money, or gifts.
- **Professional UI**: Built with React, TypeScript, and Material UI.

## Tech Stack
- **Backend**: Python (FastAPI), SQLAlchemy, PostgreSQL.
- **Frontend**: React, TypeScript, Vite, Material UI.
- **Infrastructure**: Docker, Docker Compose, Nginx.

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
- `backend/app/api`: API Routers (Auth, Children, Tasks, Rewards, Settings).
- `backend/app/models`: SQLAlchemy Database Models.
- `backend/app/services`: Business logic for Badges and Streaks.
- `frontend/src/pages`: React Pages (ParentDashboard, ChildDashboard).
- `frontend/src/components`: UI Components.
