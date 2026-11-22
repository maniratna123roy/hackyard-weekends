# Architectural & Design Decisions

## 1. Local Database Engine
- **Decision:** Use SQLite via Prisma (`file:./dev.db`) in `server/prisma/dev.db` for the local database setup requested by the user: "FOR NOW ALL DATA SHOULD BE SYNCED PROPERLY AND FOR NOW JUST USE LOCAL DATABASE , NO NEED TO USE ANY CLOUD DATABASE AND MAKE SURE THE AUTH WORKS PROPERLY".
- **Rationale:** Zero external dependencies (no docker or external cloud connection needed), 100% reliable local ACID transactions, fully managed by Prisma schema and migrations, easily migrated to PostgreSQL later by changing provider in `schema.prisma`.

## 2. Framework & API Integration Architecture
- Next.js App Router exists in the root workspace.
- We will build the robust API service in `server/` with Fastify, Prisma, Zod, and Socket.IO as specified by the spec.
- Alternatively, or in addition, we can proxy `/api/v1` in `next.config.mjs` to `http://localhost:4000/api/v1` or integrate an API client that directly talks to `http://localhost:4000/api/v1` (with credentials).

## 3. Strict Email-to-Role Constraint (User Instruction 1 & 2)
- When a user registers with an email under a role (`participant` or `founder`), that email is permanently bound to that role.
- If they try to sign in or sign up with that same email under a different role, the API rejects it with `403 ROLE_MISMATCH: "This email is registered as a <role>. To access another role, sign in with that role's account."`.
- There is NO role switcher in any dashboard. The user must click "Sign out" and log in with their account for the other role.

## 4. Admin Credentials & Access (User Instruction 3 & 6)
- Email: `hackyard@weekend.com`
- Password / Access code: `hacktheweekend`
- The system automatically seeds `hackyard@weekend.com` as an `admin` role user.
- Admin has full visibility ("king"): access to all events, all startups, all missions, all submissions across all teams, users, audit logs, and analytics.

## 5. Founder Judging (User Instruction 5)
- Founders can view and score submissions for the missions created by their startup.
- We will provide dedicated UI controls to review submissions, score each rubric criterion (0-10), write feedback, and publish results.
