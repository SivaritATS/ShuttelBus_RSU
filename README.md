# Shuttle Bus RSU — University Shuttle Tracking

Sprint 1 foundation for the university shuttle tracking system. The codebase is organized into a Next.js frontend and a backend layer for REST handlers, validation, Prisma, and PostgreSQL/PostGIS access.

## Project structure

```text
Backend/
├── prisma/                 # Schema, migrations, and seed data
├── src/
│   ├── api/                # REST API handlers
│   └── lib/                # Prisma client, validation, and backend helpers
└── tests/                  # Backend tests

FrontEnd/
├── app/                    # Next.js pages and API route adapters
├── components/             # Admin, public, and map UI components
└── types/                  # Frontend-facing API types
```

`FrontEnd/app/api` contains only Next.js route adapters. The implementation lives in `Backend/src/api`, so the API remains separated from the UI while preserving the `/api/...` URLs required by Next.js.

## Quick start

```bash
cp .env.example .env
npm install
docker compose up -d db
npm run db:deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public web and live vehicle locations, [http://localhost:3000/login](http://localhost:3000/login) for admin login, and [http://localhost:3000/admin](http://localhost:3000/admin) for the dashboard.

## Authentication and roles

The application has a login page at [http://localhost:3000/login](http://localhost:3000/login). There is intentionally no public registration page. Dev creates or resets accounts from the backend command:

```bash
npm run db:deploy
npm run db:user -- --username admin --password "เปลี่ยนรหัสผ่านนี้" --role ADMIN
npm run db:user -- --username staff --password "เปลี่ยนรหัสผ่านนี้" --role USER
```

Usernames are normalized to lowercase and passwords must contain at least 8 characters. Passwords are stored as bcrypt hashes, while login sessions are stored in the `sessions` table and exposed to the browser only through an HttpOnly cookie. Only `ADMIN` users can open `/admin` or create, edit, delete, reorder routes/stops, and update vehicle Latitude/Longitude. Public route, stop, and active vehicle location browsing remains available without login.

## API surface

| Resource | Endpoints |
| --- | --- |
| Health | `GET /api/health` |
| Vehicles | `GET/POST /api/vehicles`, `GET/PATCH/DELETE /api/vehicles/:id` |
| Routes | `GET/POST /api/routes`, `GET/PATCH/DELETE /api/routes/:id` |
| Stops | `GET/POST /api/stops`, `GET/PATCH/DELETE /api/stops/:id` |
| RouteStop | `GET/POST /api/routes/:routeId/stops`, `PATCH /api/routes/:routeId/stops/:stopId`, `DELETE /api/routes/:routeId/stops/:stopId`, `PATCH /api/routes/:routeId/stops/reorder` |

All errors use the same shape: `{ "error": { "message": "...", "code": "...", "details": {} } }`. Validation returns HTTP 422, duplicate data returns 409, missing resources return 404, and invalid references return 400.

## Development commands

```bash
npm run typecheck   # TypeScript check
npm test            # Validation tests
npm run build       # Production build
npm run db:migrate  # Create/apply a local development migration
```

The Next.js project lives in `FrontEnd`, while database commands target `Backend/prisma` through the scripts in the root `package.json`.

The supplied SQL dump was a MariaDB export containing future-domain tables such as trips and GPS tracks. The Sprint 1 Prisma schema intentionally migrates the four core management models plus Vehicle to PostgreSQL/PostGIS; trips, GPS, authentication, realtime tracking, ETA, and user location remain outside this sprint.
