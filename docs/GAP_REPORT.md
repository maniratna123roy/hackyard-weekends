# Gap Report: Frontend Analysis & Spec Mapping

## 1. Overview
This report evaluates the current frontend implementation in `c:\Users\Maniratna Roy\Documents\HACKYARD_WEEKENDS\hackyard-weekends` against the Hackyard Weekends Backend Build Spec and the User's Requirements.

## 2. Stack & Libraries in Use
- **Framework:** Next.js (16.4.3), React 19, TypeScript (5.7.3)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss` 4.3.3), `tw-animate-css`, custom CSS in `app/globals.css`
- **Component Primitives:** shadcn / UI components, Lucide React icons
- **Form Handling:** `react-hook-form` (7.92.0) with `@hookform/resolvers` & `zod` (4.6.7)
- **Routing:** Next.js App Router (`app/[[...slug]]/page.tsx` acting as a single-page router rendering `components/hackyard-app.tsx` based on `usePathname()`)
- **Data Fetching / State:** Currently purely mock/prototype state in React memory (`useState`). No data fetching library or client (no TanStack Query, no Supabase client, no localStorage persistence).

## 3. Storage & Persistence Check
- **Forbidden Persistence:**
  - `localStorage`: None found.
  - `sessionStorage`: None found.
  - `indexedDB`: None found.
  - `redux-persist` / `zustand`: None found.
  - `src/mocks`: None found.
- All current prototype states are in-memory React state (`useState`), which complies with the non-persistence rule but needs to be backed by the real API.

## 4. User Requirements Integration
1. **Email Role Exclusivity:**
   - One email can only belong to one role (`participant`, `founder`, or `admin`).
   - If an email was signed up as a participant, it cannot sign up or log in as founder or admin, and vice-versa.
   - Any attempt to sign in with an existing email under a different role returns an error (`ROLE_MISMATCH` / `403 FORBIDDEN`).
2. **No Role Switching from Dashboard:**
   - Users cannot switch roles inside their dashboard.
   - To access another role, the user must log out of the current account and log in with their account corresponding to that role.
3. **Admin Credentials:**
   - Email: `hackyard@weekend.com`
   - Password / Access code: `hacktheweekend`
   - In simple auth mode, `hackyard@weekend.com` requires `hacktheweekend` to authenticate as admin.
4. **Local Database & Synced Data:**
   - Per requirement 4 ("for now just use local database , no need to use any cloud database and make sure the auth works properly"): we will use SQLite or local PostgreSQL via Prisma, fully synchronized and local-ready, with clean migration path. (Using SQLite locally satisfies zero external cloud config while giving full relational rigor and 100% data sync).
5. **Founder Submissions & Judging:**
   - Founders judge submissions for their own missions only.
   - UI buttons/sections can be added/augmented as needed to make the judging, mission viewing, and workflow completely seamless.
6. **Admin King Mode:**
   - Admin sees everything: all events, all startups, all missions, all submissions, all users, audit logs, and reports.

## 5. Route Mapping Table
| Spec Route | Current Frontend Component / State | Action Required |
|---|---|---|
| `/` | `Landing` in `hackyard-app.tsx` | Wire dynamic event/mission previews |
| `/login`, `/signup` | `AuthRoute` / `RouteForm('auth')` | Replace with simple sign-in with role exclusivity and admin code support |
| `/onboarding` | `AuthRoute(path === '/onboarding')` | Streamline to simple role onboarding if needed |
| `/events` | `Discovery` in `hackyard-app.tsx` | Wire to `GET /events` & `GET /events/:id/missions` |
| `/events/:id` | `MissionDetail` in `hackyard-app.tsx` | Wire to real event details & stats |
| `/events/:id/missions` | `Discovery` in `hackyard-app.tsx` | Wire to real mission board with filters |
| `/events/:id/results` | Handled generically by `SimplePage` | Wire to real results & leaderboard |
| `/missions/:id` | `MissionDetail` in `hackyard-app.tsx` | Wire to `GET /missions/:id` with kickoff-time brief guard |
| `/report/:missionId` | `SimplePage` | Wire to real mission report |
| `/p/:username` | `SimplePage` | Wire to `GET /users/:username` |
| `/dashboard` | `AppShell` with `DashboardContent('participant')` | Wire real stats, teams, and registered missions |
| `/dashboard/teams` | `TeamsContent` in `hackyard-app.tsx` | Wire to `GET /teams/mine`, create team, join with invite code |
| `/dashboard/certificates` | `MultiContent` (empty state) | Wire to `GET /me/certificates` |
| `/dashboard/rewards` | `MultiContent` (empty state) | Wire to `GET /me/rewards` |
| `/room/:teamId` | `RoomWorkspace` in `hackyard-app.tsx` | Wire to real brief, timer, chat, announcements, Q&A |
| `/room/:teamId/submit` | `MissionSubmit` in `hackyard-app.tsx` | Wire autosave drafts, type-specific schemas, final submit |
| `/room/:teamId/team` | `TeamsContent` in `hackyard-app.tsx` | Wire team management (members, lead, invites) |
| `/founder` | `AppShell` with `DashboardContent('founder')` | Wire real founder stats, startup status, missions |
| `/founder/startup` | `RouteForm('profile')` | Wire to `GET/POST/PATCH /startups` |
| `/founder/missions/new` | `RouteForm('mission')` | Wire multi-step brief builder with draft autosave |
| `/founder/missions/:id` | `MultiContent` (empty state) | Wire mission manage, Q&A answers, announcements |
| `/founder/missions/:id/submissions` | Missing separate screen | Implement real submissions viewer for founder |
| `/founder/missions/:id/judge` | `JudgeWorkspace` | Wire real rubric scoring, blind judging toggle, publish results |
| `/founder/missions/:id/results` | Handled generically | Wire results overview & reward confirmation |
| `/admin` | `AppShell` with `DashboardContent('admin')` | Wire platform operational metrics & overview |
| `/admin/events` | `AdminTable('Events')` | Wire real event management |
| `/admin/startups` | `AdminTable('Startups')` | Wire startup review queue |
| `/admin/missions` | `AdminTable('Missions')` | Wire mission approval queue & overrides |
| `/admin/users` | `AdminTable('Users')` | Wire user listing, ban/unban |
| `/admin/reports` | `AdminTable('Reports')` | Wire reports review & resolve |
| `/admin/analytics` | `MultiContent` analytics grid | Wire platform analytics |
| `/admin/audit` | Missing in current prototype | Wire audit log view |
| `/verify/:code` | `SimplePage` | Wire public certificate verification |
| `/share/:username` | `GrowthPage` | Wire share card |

## 6. Deprecated / Removed Concepts
- Removed `Judge` role options from waitlist and onboarding (found in `hackyard-app.tsx` lines 67, 73, 95).
- Removed guest/judge standalone routes or menu items.
