# Hackyard Weekends — Local Fullstack System

This repository contains the complete Hackyard Weekends application: Next.js frontend integrated with Fastify API, Prisma ORM, and local SQLite database.

## Architecture & Requirements Implementation

### 1. Single-Role Email Exclusivity
- An email registered as a `participant` can **never** be used to sign up or sign in as a `founder` or `admin` (and vice-versa).
- Enforced at both the database and API level (`ROLE_MISMATCH` rejection).

### 2. Strict Role Isolation (No in-dashboard role switching)
- Dashboards do not allow switching roles directly.
- Users must click **Sign out** and log into their corresponding account to switch context.

### 3. Admin Credentials
- **Email:** `hackyard@weekend.com`
- **Password / Access Code:** `hacktheweekend`
- Admins possess "King" access with platform-wide visibility across all events, startups, missions, submissions, analytics, and user moderation.

### 4. Fully Synced Local Database
- Powered by Prisma with SQLite (`server/prisma/dev.db`), satisfying zero cloud database dependency while maintaining full relational integrity.
- All mock data has been replaced with live API endpoints and real-time syncing.

### 5. Founder Judging
- Founders can create missions, define weighted rubrics (totaling 100%), review submissions submitted by teams for their missions, assign criterion scores (0-10), and publish results.

---

## Running the Application

### 1. Start the Backend API (Fastify + SQLite)
```bash
cd server
npm install
npx prisma db push
npx tsx prisma/seed.ts
npx tsx src/server.ts
```
The API runs at `http://127.0.0.1:4000`.

### 2. Start the Frontend (Next.js)
```bash
# in the root directory
pnpm install
pnpm dev
```
The app runs at `http://localhost:3000`. Rewrites forward `/api/v1/*` directly to `http://127.0.0.1:4000/api/v1/*`.

### 3. Demo Credentials
- **Admin:** `hackyard@weekend.com` / `hacktheweekend`
- **Founder:** `alex@acmeai.io` (Role: Founder)
- **Participant:** Register any email under the Participant role
