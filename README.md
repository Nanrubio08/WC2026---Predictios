# Polla Mundialista — World Cup Prediction App

A full-stack World Cup prediction ("quiniela") web application. Users register, predict match scores before a 30-minute lock window, and are ranked on a live leaderboard.

## Architecture

Microservices monorepo orchestrated with Docker Compose:

```
├── auth-service/          Node.js + TypeScript — registration, login, JWT
├── matches-service/       Node.js + TypeScript — match calendar, scoring, API-Football cron
├── predictions-service/   Node.js + TypeScript — predictions, 30-min lock, leaderboard
├── frontend/              React 18 + Vite + Tailwind CSS → served via Nginx
└── docker-compose.yml     3 PostgreSQL DBs + 4 app containers on worldcup-net
```

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose

### Local dev (no Docker)

```bash
cp .env.example .env
# Edit .env with your DB credentials and secrets

npm install          # installs all workspaces

# Run each service in separate terminals:
npm run dev:auth
npm run dev:matches
npm run dev:predictions
npm run dev:frontend  # Vite dev server on http://localhost:5173
```

### Docker Compose (full stack)

```bash
cp .env.example .env
# Edit .env

docker compose up --build
# Frontend: http://localhost:80
# auth-service:        http://localhost:3001
# matches-service:     http://localhost:3002
# predictions-service: http://localhost:3003
```

### Database migrations (per service)

```bash
cd auth-service && npx prisma migrate dev
cd matches-service && npx prisma migrate dev
cd predictions-service && npx prisma migrate dev
```

## API Reference

| Method | Path | Auth | Service |
|--------|------|------|---------|
| POST | `/api/auth/register` | — | auth-service |
| POST | `/api/auth/login` | — | auth-service |
| GET | `/api/matches` | optional JWT | matches-service |
| POST | `/api/predictions` | JWT required | predictions-service |
| GET | `/api/leaderboard` | — | predictions-service |
| POST | `/api/admin/matches/:id/score` | admin JWT | matches-service |

## Key Business Rules

- **30-min prediction lock** — enforced server-side in `predictions-service` only; never client-side
- **Scoring** — event-driven when match transitions to `finished`: 5pts exact, 3pts correct outcome, 0pts wrong
- **Leaderboard** — cached `total_points` column, never recalculated on reads
- **Fixture sync** — daily cron at 03:00 UTC via API-Football
- **Live poll** — every 5 minutes on match days, triggers scoring on FT status

## Environment Variables

See `.env.example` for the full list of required variables.
