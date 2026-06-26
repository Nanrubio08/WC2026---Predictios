# AGENTS.md — Polla Mundialista

World Cup prediction app (microservices monorepo). Users register, predict scores before a **10-minute lock**, and are ranked on a live leaderboard.

## Quick commands

```bash
npm install          # install all workspaces (postinstall runs prisma:generate)
npm run dev          # run all services + frontend concurrently
npm run build        # tsc all services + vite build for frontend
npm run lint         # eslint across all workspaces
npm run dev:auth     # auth-service:3001
npm run dev:matches  # matches-service:3002
npm run dev:predictions  # predictions-service:3003
npm run dev:frontend # Vite :5173
```

### Tests
No test framework — plain ts-node script:
```bash
cd backend/predictions-service && npx ts-node src/services/scoring.test.ts
```

### Prisma (run from each service directory)
```bash
cd backend/auth-service && npx prisma migrate dev
```
Prisma client outputs to `src/generated/client` (custom `generator` output path).

## Architecture

| Service | Port | DB | Role |
|---|---|---|---|
| `auth-service` | 3001 | worldcup-auth-db | Reg/login, JWT, user CRUD, invite codes, password reset |
| `matches-service` | 3002 | worldcup-matches-db | Match calendar, API-Football sync, live poll, score admin |
| `predictions-service` | 3003 | worldcup-predictions-db | Predictions, scoring, leaderboard, bonus (Golden Ball) |
| `frontend` | 8080 (prod) / 5173 (dev) | — | React 18 + Vite + Tailwind, Nginx reverse proxy |

Services share `worldcup-net` Docker bridge. Dev: `docker compose up --build`. Prod: `docker compose -f docker-compose.prod.yml up --build`.

## Critical facts (agent blind spots)

- **Prediction lock is 10 minutes** (`predictionLock.ts:6`), not 30 as documented elsewhere.
- **Dynamic match polling** replaces fixed cron: polls every 1 min when live/soon, 5 min when approaching, 1h when far away, 6h when idle. **syncFixtures is daily at 03:00 UTC** (metadata safety net). Startup runs `runInitialSync()` once.
- **Internal service calls** use `x-internal-token` header on `/internal/*` routes (not JWT). Client modules live in each service's `src/clients/`.
- **Scoring**: 5 pts exact, 3 pts correct outcome, 0 pts wrong. Runs in a Prisma `$transaction`. Leaderboard updates are **delta-based** (cached column, never sum predictions on read).
- **Prisma schemas** all include `binaryTargets = ["native", "debian-openssl-3.0.x"]` — keep this for Docker. DB columns use `snake_case` via `@map()`.
- **`Match.id` is an Int** (API-Football fixture ID), not a UUID.
- **Auth**: 15-min JWT access token + 7-day refresh token (httpOnly cookie). All services share `JWT_SECRET` and validate independently. Admin routes check `req.userRole`.
- **Frontend API client** (`api.ts`) uses empty `baseURL` — same-origin, routed by Nginx. JWT in `localStorage` key `token`. Use `setSession`/`clearSession` from `useAuthToken`, not localStorage directly.
- **Registration** requires a 6-digit numeric invite code (except admin accounts).
- **Frontend dev Vite proxy** maps `/api/*` to the three backends — no Nginx needed in dev.

## Existing instruction file

See `.github/copilot-instructions.md` for detailed architecture, conventions, and API endpoints — but beware the **lock window, cron intervals, and poll frequency** inaccuracies listed above (code is the source of truth).
