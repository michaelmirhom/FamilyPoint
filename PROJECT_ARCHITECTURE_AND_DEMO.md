# FamilyPoints - Project Architecture & Demo Guide

This document provides a comprehensive overview of the **FamilyPoints** application, including its technical architecture, technology stack, and a step-by-step demo guide to understand how the application works.

## 1. Project Overview
**FamilyPoints** is a gamified household management application designed to encourage children to complete tasks (chores, habits, faith-based activities) in exchange for points. These points can then be redeemed for rewards (monetary, privileges, or gifts).

The application is built with a strict separation of concerns, featuring a modern **Single Page Application (SPA)** frontend and a robust **RESTful API** backend.

---

## 2. Technology Stack

### Frontend (Client-Side)
The frontend is built to be responsive, fast, and user-friendly.
*   **Framework**: [React](https://react.dev/) (v18) - A JavaScript library for building user interfaces.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) - Adds static typing to JavaScript for better code quality and developer experience.
*   **Build Tool**: [Vite](https://vitejs.dev/) - A next-generation frontend tooling that provides fast development server and optimized builds.
*   **UI Component Library**: [Material UI (MUI)](https://mui.com/) - A comprehensive library of pre-built React components implementing Google's Material Design.
*   **Routing**: [React Router DOM](https://reactrouter.com/) - Handles client-side navigation between pages (Dashboard, Login, etc.).
*   **HTTP Client**: [Axios](https://axios-http.com/) - Handles API requests to the backend with interceptors for authentication tokens.

### Backend (Server-Side)
The backend provides the API endpoints, business logic, and database management.
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - A modern, fast (high-performance) web framework for building APIs with Python based on standard Python type hints.
*   **Language**: [Python](https://www.python.org/) (3.10+)
*   **Server**: [Uvicorn](https://www.uvicorn.org/) - An ASGI web server implementation for Python.
*   **Database ORM**: [SQLAlchemy](https://www.sqlalchemy.org/) - The Python SQL toolkit and Object Relational Mapper.
*   **Data Validation**: [Pydantic](https://docs.pydantic.dev/) - Data validation and settings management using Python type annotations.
*   **Authentication**: OAuth2 with Password Flow and **JWT** (JSON Web Tokens) via `python-jose` and `passlib` for password hashing (Bcrypt).

### Database
*   **PostgreSQL**: A powerful, open-source object-relational database system. It stores all user data, tasks, transactions, and settings.

### DevOps & Infrastructure
*   **Docker & Docker Compose**: Used to containerize the application (Frontend, Backend, and Database) for consistent development and deployment environments.

---

## 3. Architecture & Data Flow

 The system follows a classic **Client-Server Architecture**:

1.  **User Action**: A user (Parent or Child) interacts with the React Frontend.
2.  **API Request**: The frontend sends an HTTP request (GET, POST, PUT, DELETE) to the FastAPI backend.
    *   *Example*: `POST /api/v1/auth/login` with credentials.
3.  **Authentication**: The backend validates the JWT token sent in the `Authorization` header (Bearer token) for protected routes.
4.  **Business Logic**: The backend processes the request (e.g., calculating points, checking permissions).
5.  **Database Interaction**: SQLAlchemy translates the logic into SQL queries to read/write data to PostgreSQL.
6.  **Response**: The backend returns a JSON response to the frontend.
7.  **UI Update**: The frontend updates the state and UI based on the new data.

### Key Database Models
*   **User**: Stores parents and children. Differentiated by a `role` ('PARENT' or 'CHILD').
*   **Task**: Defined by parents. Contains points, category (Faith, School, Home), and description.
*   **Submission**: Record of a child completing a task. Can be `PENDING`, `APPROVED`, or `REJECTED`.
*   **Reward**: Items defined by parents that children can buy.
*   **RewardRedemption**: A request by a child to buy a reward.
*   **PointsLedger**: An immutable history of every point transaction (earning or spending). This allows calculating the current balance by summing the history.
*   **ParentSettings**: Configuration for point-to-dollar conversion rates.

---

## 4. Demo Walkthrough

Use this script to demonstrate the full capabilities of FamilyPoints.

### Phase 1: Parent Setup (The Admin)
1.  **Registration**:
    *   Go to the Login page.
    *   Click "New Parent? Register Here".
    *   Create a new account (e.g., Name: "Dad", Email: "dad@test.com").
2.  **Dashboard Overview**:
    *   Log in. You land on the **Parent Dashboard**.
    *   You see tabs: *Overview*, *Children*, *Tasks Library*, *Rewards*.
3.  **Add a Child**:
    *   Go to the **Children** tab.
    *   Click "Add Child".
    *   Enter details (Name: "Junior", Username: "junior", Password: "123").
4.  **Create Tasks**:
    *   Go to **Tasks Library**.
    *   Use the **"Quick Add from Templates"** section to quickly add common tasks like "Read Bible" or "Clean Room".
    *   Or create a custom task using the "Create Custom Task" button.
5.  **Create Rewards**:
    *   Go to **Rewards**.
    *   Create a reward (e.g., "Ice Cream", Cost: 50 points).

### Phase 2: Child Interaction (The User)
1.  **Login**:
    *   Log out of the parent account.
    *   Log in with the child's credentials ("junior" / "123").
2.  **Dashboard**:
    *   Observe the **Child Dashboard**. It shows Total Points (0), Level (1), and a progress bar.
3.  **Complete a Task**:
    *   Find "Read Bible" in the "Available Tasks" list.
    *   Click "Complete".
    *   (Optional) Add a note or reflection.
    *   Click "Submit".
    *   *Note*: Points are not awarded yet! The status is "Pending".
4.  **Try to Buy Reward**:
    *   See "Ice Cream" in the Rewards Store.
    *   Try to click "Redeem". It should fail or be disabled because you have 0 points.

### Phase 3: Parent Approval
1.  **Approve Task**:
    *   Log back in as **Parent**.
    *   Check the **Overview** tab.
    *   See the "Pending Tasks" list.
    *   Click **Approve** on Junior's submission.
2.  **Verification**:
    *   The task disappears from the pending list.
    *   Junior has now earned the points.

### Phase 4: Child Rewards
1.  **Redeem Reward**:
    *   Log in as **Child**.
    *   Check the top bar: Points have increased!
    *   Go to the Rewards Store.
    *   Click "Redeem" on "Ice Cream".
    *   Confirm the purchase.
    *   **immediate Effect**: Points are deducted instantly.

### Phase 5: Final Fulfillment
1.  **Fulfill Request**:
    *   Log in as **Parent**.
    *   Check **Overview**.
    *   See "Reward Requests".
    *   Click **Approve** (signaling you have given the child the ice cream).
    *   *Alternatively*: If you click **Reject**, the points are refunded to the child.

---

## 5. Directory Structure
*   `backend/`: Contains the FastAPI application.
    *   `app/main.py`: Entry point.
    *   `app/api/`: API Routes.
    *   `app/models/`: Database models.
    *   `app/schemas/`: Pydantic data schemas.
*   `frontend/`: Contains the React application.
    *   `src/pages/`: Main views (Login, Dashboards).
    *   `src/components/`: Reusable UI elements.
    *   `src/api.ts`: API communication layer.
