# Hackyard Weekends · Deployment Guide

Deploy **Hackyard Weekends** to production with **Frontend on Vercel** and **Backend on Render**.

---

## Architecture Overview

```
                      ┌───────────────────────────┐
                      │      Vercel (Frontend)    │
                      │      Next.js 16 App       │
                      │  https://your-app.vercel.app│
                      └─────────────┬─────────────┘
                                    │
                                    │ /api/v1/* (Rewrites / Proxy)
                                    ▼
                      ┌───────────────────────────┐
                      │      Render (Backend)     │
                      │   Fastify API Server      │
                      │ https://your-api.onrender.com
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    Database / Storage     │
                      │  Render Disk / PostgreSQL │
                      └───────────────────────────┘
```

---

## 1. Deploy Backend on Render

### Step 1: Create a New Web Service
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository containing `hackyard-weekends`.
4. Configure the service settings:
   - **Name**: `hackyard-backend` (or your preferred name)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Region**: Choose the region closest to you (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`

### Step 2: Build & Start Commands
- **Build Command**:
  ```bash
  npm install --omit=dev --include=dev && npx prisma generate && npm run build
  ```
- **Start Command**:
  ```bash
  npx prisma db push && npm run seed && npm start
  ```
- **Environment Variables**:
  Make sure to add:
  | Variable | Value | Notes |
  |---|---|---|
  | `NODE_OPTIONS` | `--max-old-space-size=384` | Prevents Render Free Tier (512MB RAM) OOM |

### Step 3: Environment Variables on Render
Under **Environment Variables**, add:
| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables production mode |
| `PORT` | `10000` | Render default port |
| `HOST` | `0.0.0.0` | Binds to all interfaces |
| `APP_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL (update after creating Vercel app) |
| `SESSION_SECRET` | *(Random 32+ character string)* | e.g. `c7489ab83cf10e8293781ad840134812` |
| `ADMIN_EMAILS` | `hackyard@weekend.com` | Authorized Admin email |
| `ADMIN_ACCESS_CODE` | `hacktheweekend` | Admin password / access code |
| `DATABASE_URL` | `file:/data/dev.db` (with Persistent Disk) or `file:./prisma/dev.db` | See Database section below |

> **Production Database Note**:
> For persistent SQLite on Render, attach a **Persistent Disk** mounted at `/data` with `DATABASE_URL=file:/data/dev.db`.
> Alternatively, switch `prisma/schema.prisma` provider to `postgresql` and attach a free Render PostgreSQL database.

---

## 2. Deploy Frontend on Vercel

### Step 1: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Select your `hackyard-weekends` GitHub repository.
4. Set the **Root Directory** to `.` (the repository root).

### Step 2: Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `pnpm install` or `npm install`

### Step 3: Environment Variables on Vercel
Under **Environment Variables**, configure:
| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `https://hackyard-backend.onrender.com` | Your deployed Render backend URL |

*(The Next.js `next.config.mjs` automatically proxies `/api/v1/:path*` to `NEXT_PUBLIC_BACKEND_URL` so all cookies and session credentials transfer smoothly without cross-site cookie restrictions).*

---

## 3. Verify Deployment

1. **Backend Health Check**:
   Visit `https://hackyard-backend.onrender.com/api/v1/health`
   You should receive:
   ```json
   { "status": "ok", "db": true, "timestamp": "..." }
   ```

2. **Frontend Authentication Flow**:
   - Navigate to `https://your-app.vercel.app/login`
   - Click the **Admin** tab
   - Enter password `hacktheweekend`
   - Confirm login directs you to King Mode (`/admin`)

3. **Participant / Founder Workflows**:
   - Sign up a Participant account (`alice@builder.com`) → lands in `/dashboard`
   - Log out and sign up a Founder account (`founder@startup.com`) → lands in `/founder`
   - Notice strict role isolation preventing cross-login or unauthorized switching.
