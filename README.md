# Job Management System — Backend

A REST API for a job marketplace built with **PERN** (PostgreSQL, Express, React, Node) + **Prisma** + **TypeScript**. Users post jobs, complete tasks, earn rewards, process withdrawals, verify their identity, and open disputes — with role-based access control, refresh-token rotation, social login, and phone OTP verification.

## Tech Stack

- **Runtime:** Node.js 18+, TypeScript
- **Framework:** Express 4
- **ORM / DB:** Prisma 5 + PostgreSQL (multi-schema)
- **Validation:** zod
- **Auth:** JWT (access + rotating refresh tokens), bcrypt, Google/Facebook OAuth, OTP
- **Extra:** helmet, cors, cookie-parser, express-rate-limit, pino logging, Cloudinary, multer

## Project Structure

```
prisma/
├── datasource.prisma    # generator + datasource (multiSchema)
├── user.prisma          # identity schema — User, RefreshToken
├── verification.prisma  # identity schema — VerificationRequest
├── job.prisma           # jobs schema — Job, JobStep, JobLike, JobComment
├── task.prisma          # jobs schema — Task, TaskStep
├── dispute.prisma       # jobs schema — Dispute
└── finance.prisma       # finance schema — Transaction, Withdrawal
scripts/
└── merge-prisma-schema.cjs  # merges partials into prisma/schema.prisma
src/
├── config/        # env/config, prisma client, cookies, cloudinary, permissions
├── middlewares/   # auth, validation, rate-limit, errors, upload, requestId
├── modules/
│   ├── auth/           # register, login, social, OTP, refresh, logout, me
│   ├── user/           # user management
│   ├── job/            # job CRUD, likes, comments
│   ├── task/           # task acceptance/submission/approval
│   ├── transaction/    # earnings & withdrawals ledger
│   ├── verification/   # identity verification requests
│   └── dispute/        # job/task disputes
├── routes/        # route mounting under /api/v1
├── types/         # shared types & express augmentations
└── utils/         # jwt, otp, socialAuth, pagination, responses, logger, ...
tests/             # jest + supertest
```

> **Prisma schema is auto-generated.** Edit the `prisma/*.prisma` partials and run `npm run prisma:generate` — never edit `prisma/schema.prisma` directly.

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database with the `identity`, `jobs`, and `finance` schemas

### 2. Install

```bash
npm install
```

### 3. Environment variables

Copy `.env` and fill in the values (see [Configuration](#configuration) for the full list). At minimum:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/job_management_db
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
```

### 4. Database

```bash
npm run prisma:migrate   # merges partials, then prisma migrate dev
npm run prisma:generate  # merges partials, then generates the client
```

### 5. Run

```bash
npm run dev     # ts-node-dev with hot reload
npm run build   # compile to dist/
npm start       # run the compiled server
```

Health check: `GET /health` — returns `200` when the DB is reachable.

## Scripts

| Command                | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start dev server with hot reload             |
| `npm run build`        | TypeScript compile to `dist/`                |
| `npm start`            | Run the compiled server                      |
| `npm test`             | Run jest test suite                          |
| `npm run prisma:merge` | Merge prisma partials into `schema.prisma`   |
| `npm run prisma:generate` | Merge partials + `prisma generate`        |
| `npm run prisma:migrate`  | Merge partials + `prisma migrate dev`     |

## API Overview

All routes are mounted under `/api/v1`.

| Module         | Base Path        | Highlights                                   |
| -------------- | ---------------- | --------------------------------------------- |
| Auth           | `/auth`          | register, login, `social/:provider`, otp request/verify, refresh-token, logout, me (GET/PATCH) |
| Users          | `/users`         | user listing/profile management               |
| Jobs           | `/jobs`          | job CRUD, like, comment                       |
| Tasks          | `/tasks`         | accept, submit, approve/reject tasks          |
| Transactions   | `/transactions`  | earnings & withdrawal ledger                  |
| Verification   | `/verifications` | identity verification requests (admin review) |
| Disputes       | `/disputes`      | open/resolve disputes, admin mediation        |

Authentication uses **httpOnly cookies** (`accessToken`, `refreshToken`, `role`). Refresh tokens are stored server-side as SHA-256 hashes, rotated on every refresh, and revoked on logout.

## Configuration

Key environment variables:

| Variable                     | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `NODE_ENV`                   | `development` / `production`                  |
| `PORT`                       | Server port (default in `.env`: 5000)        |
| `CLIENT_URL` / `FRONTEND_URL`| Allowed CORS origin(s)                        |
| `DATABASE_URL`               | PostgreSQL connection string                  |
| `JWT_ACCESS_SECRET`          | Access-token signing secret                  |
| `JWT_REFRESH_SECRET`         | Refresh-token signing secret                 |
| `JWT_ACCESS_EXPIRES_IN`      | e.g. `15m`                                   |
| `JWT_REFRESH_EXPIRES_IN`     | e.g. `30d`                                   |
| `GOOGLE_CLIENT_ID`/`...SECRET`/`...REDIRECT_URI` | Google OAuth           |
| `FACEBOOK_APP_ID`/`...CLIENT_SECRET`/`...REDIRECT_URI` | Facebook OAuth       |
| `OTP_PROVIDER`               | `console` (dev) or a real SMS provider name  |
| `DEV_OTP`                    | Dev OTP accepted in non-production (`123456`)|
| `CLOUDINARY_*`               | Cloudinary credentials for file uploads      |
| `SUPPORT_EMAIL` / `APP_PASSWORD` | Support mailer                         |
| `Store_ID` / `Store_Password`| Payment merchant (bKash/Nagad/Rocket) sandbox|