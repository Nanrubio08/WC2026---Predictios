# Copilot Instructions — Polla Mundialista

## What This Is

A World Cup prediction ("quiniela") app. Users register, predict match scores before a 30-minute lock window, and are ranked on a live leaderboard. Built as a **microservices monorepo** with Docker Compose.

## Commands

### Root (all workspaces)
```bash
npm install                  # install all workspaces
npm run dev                  # run all services + frontend concurrently
npm run build                # build all services + frontend
npm run lint                 # lint all workspaces
```

### Per-service dev
```bash
npm run dev:auth             # auth-service (port 3001)
npm run dev:matches          # matches-service (port 3002)
npm run dev:predictions      # predictions-service (port 3003)
npm run dev:frontend         # Vite dev server (port 5173)
```

### Prisma (run from each service directory)
```bash
cd backend/auth-service && npx prisma migrate dev
cd backend/matches-service && npx prisma migrate dev
cd backend/predictions-service && npx prisma migrate dev
```

### Tests
There is one test file — a plain Node/ts-node script (no test framework):
```bash
cd backend/predictions-service
npx ts-node src/services/scoring.test.ts
```

### Docker
```bash
docker compose up --build    # full stack; frontend on :8080
```

## Architecture

Three independent Node.js/TypeScript/Express backend services, each with its own PostgreSQL database:

| Service | Port | DB | Responsibility |
|---|---|---|---|
| `auth-service` | 3001 | `worldcup-auth-db` | Registration, login, JWT issuance, user lookups |
| `matches-service` | 3002 | `worldcup-matches-db` | Match calendar, API-Football sync, live polling, score admin |
| `predictions-service` | 3003 | `worldcup-predictions-db` | Predictions, 30-min lock, scoring, leaderboard |

**Frontend**: React 18 + Vite + Tailwind CSS, served by Nginx in production. The Nginx container reverse-proxies `/api/auth/*`, `/api/matches/*`, `/api/predictions/*`, and `/api/leaderboard` to the respective services.

**Cross-service calls**: Services communicate on the `worldcup-net` Docker bridge network. Internal calls (not user-facing) use the `/internal/` URL prefix and are authenticated with the `x-internal-token` header (value = `INTERNAL_SERVICE_TOKEN` env var), not JWT.

**Service interaction flow**:
- `matches-service` → `predictions-service`: triggers scoring after a match transitions to `finished`
- `predictions-service` → `matches-service`: reads match data (kickoff time, status) to enforce the 30-min lock
- `predictions-service` → `auth-service`: fetches usernames in batch to hydrate leaderboard responses

## Key Conventions

### Authentication
- All three services share the same `JWT_SECRET` and validate JWTs independently — there is no central auth gateway.
- The `authenticateJwt` middleware (each service has its own copy) attaches `req.userId` and `req.userRole` to the request.
- Admin routes check `req.userRole === 'admin'`.

### Internal service-to-service calls
- Use the `x-internal-token` header, **not** JWT.
- Internal endpoints live under `/internal/` and are protected by the `requireInternalToken` middleware.
- Client modules for cross-service HTTP calls live in each service's `src/clients/` directory.

### 30-minute prediction lock
- Enforced **only** server-side via the `predictionLock` middleware in `predictions-service`.
- The lock compares `Date.now()` against `kickoffTime - 30 minutes` fetched live from `matches-service`.
- Never rely on the frontend to enforce this.

### Scoring & leaderboard
- Scoring runs inside a single Prisma `$transaction` — updates `predictions.points_earned` and `leaderboard.total_points` atomically.
- Leaderboard updates are **delta-based**: `delta = newPoints - previousPointsEarned`, so re-scoring a match applies the difference rather than overwriting.
- `leaderboard.total_points` is a cached column — never recalculate it by summing predictions on read.
- Scoring logic: 5 pts exact score, 3 pts correct outcome (win/draw/loss), 0 pts otherwise. Source of truth: `src/services/calculatePoints.ts`.

### Prisma schemas
- All schemas include `binaryTargets = ["native", "debian-openssl-3.0.x"]` for Docker compatibility — keep this when updating schemas.
- DB columns use `snake_case`; TypeScript fields use `camelCase` — mapped via Prisma `@map()`.
- `Match.id` is an `Int` (the external API-Football fixture ID), not a UUID.

### Frontend API client
- `frontend/src/services/api.ts` uses an empty `baseURL` — all requests go to the same origin and are routed by Nginx.
- JWT is stored in `localStorage` (key: `token`). The `useAuthToken` hook manages auth state; call `setSession(token, user)` / `clearSession()` rather than touching `localStorage` directly.
- `user.role` drives the `isAdmin` flag in `useAuthToken`. The admin role is assigned in the auth-service; no client-side elevation is possible.

### Background jobs (matches-service)
- `syncFixtures` — daily cron at `03:00 UTC`, syncs the fixture calendar from **football-data.org** (`GET /v4/competitions/{FOOTBALL_COMPETITION}/matches?season={FOOTBALL_SEASON}`).
- `pollLiveMatches` — every 5 minutes, checks live match status via `GET /v4/competitions/{FOOTBALL_COMPETITION}/matches?status=IN_PLAY,PAUSED`; triggers scoring via `scoringClient` when a match transitions to `FINISHED`.
- Status mapping: `IN_PLAY`/`PAUSED`/`SUSPENDED` → `live`, `FINISHED` → `finished`, everything else → `scheduled`.
- API client lives in `src/utils/apiFootball.ts`; uses `X-Auth-Token` header with `FOOTBALL_DATA_API_KEY` env var.
