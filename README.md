# FamilyPoints

FamilyPoints is a gamified application designed to help parents encourage good habits and faith in their children through a points and rewards system.

## Features
- **Parent Dashboard**: Manage children, create tasks, approve submissions, and handle reward redemptions.
- **Child Dashboard**: Gamified view with levels, badges, streaks, and a rewards store.
- **Task System**: Supports multiple categories (Faith, School, Home, Kindness).
- **Evidence Upload**: Children can upload photos or documents as proof of task completion. Includes a custom in-app camera for mobile and desktop devices.
- **Multiple File Support**: Submissions can include multiple evidence files (images or PDFs).
- **Enhanced Review**: Parents can view all attached evidence directly within the dashboard before approving tasks.
- **Announcements**: Parents can send messages to all children with read tracking and dismissal functionality.
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
python migrate_announcements.py
python migrate_announcement_dismissals.py
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

## Cloudinary Integration (File Uploads)
FamilyPoints uses **Cloudinary** for cloud-based file storage to handle image and document uploads in production.

### Setup for Production (Render):
1. **Sign up for Cloudinary**: https://cloudinary.com/users/register_free (Free tier: 25GB storage)
2. **Get your credentials** from the Cloudinary dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. **Add to Render environment variables**:
   - Go to your Render backend service → Environment tab
   - Add these three variables:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
4. **Redeploy** your backend service

### Setup for Local Development:
Create `backend/.env` file with:
```
DATABASE_URL=postgresql://user:password@localhost/familypoints
SECRET_KEY=your-secret-key-here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Note**: Files are automatically uploaded to Cloudinary and URLs are stored in your database. This solves ephemeral storage issues on platforms like Render.

See `YOUR_CLOUDINARY_SETUP.md` for detailed setup instructions.

## Announcements Feature
Parents can send announcements/messages to all their children:

### For Parents:
1. Navigate to the **Announcements** tab in the Parent Dashboard
2. Type your message in the text field
3. Click **Send** to broadcast to all children
4. View all sent announcements with read status indicators
5. Delete announcements at any time

### For Children:
1. New announcements appear highlighted at the top of the Child Dashboard
2. Unread announcements show a **"NEW"** badge with an orange border
3. Click an announcement to mark it as read
4. After reading, click **"Dismiss"** to remove it from your dashboard
5. Children cannot dismiss announcements until they've read them first

### Key Features:
- **Read Tracking**: Parents can see which children have read each announcement and when
- **Smart Dismissal**: Children can only dismiss announcements after reading them
- **Clean Dashboard**: Dismissed announcements disappear from the child's view while parents retain full history
- **Real-time Updates**: All changes are immediately reflected across dashboards

## Project Structure
- `backend/app/api`: API Routers (Auth, Children, Tasks, Rewards, Settings, Submissions, Uploads, Announcements).
- `backend/app/models`: SQLAlchemy Database Models (including Announcements, AnnouncementRead, AnnouncementDismissal).
- `backend/app/services`: Business logic for Badges and Streaks.
- `frontend/src/pages`: React Pages (ParentDashboard, ChildDashboard).
- `frontend/src/components`: UI Components.
