# DevBoard

A full-stack **team task & project board** (Trello-style Kanban) built with React, GraphQL, and MongoDB. Create boards, organize work into columns, and drag cards between stages — with JWT authentication and multi-user collaboration.

![Tech](https://img.shields.io/badge/React-18-61dafb) ![Tech](https://img.shields.io/badge/TypeScript-5-3178c6) ![Tech](https://img.shields.io/badge/GraphQL-Apollo-e10098) ![Tech](https://img.shields.io/badge/MongoDB-7-47a248) ![Tech](https://img.shields.io/badge/Docker-ready-2496ed)

## Features

- 🔐 **Authentication** — register & login with JWT, hashed passwords (bcrypt)
- 📋 **Boards** — create, rename, and delete boards
- 🧱 **Columns** — organize work into stages (To Do / In Progress / Done seeded by default)
- 🃏 **Cards** — add tasks with title & description
- 🖱️ **Drag & drop** — move cards between columns (`@dnd-kit`)
- ⚡ **Real-time** — live board updates across clients via GraphQL subscriptions (WebSockets)
- 👥 **Collaboration** — invite members with owner / member roles
- 🐳 **Docker** — one command to run the whole stack

## Tech stack

| Layer     | Technology                                   |
| --------- | -------------------------------------------- |
| Frontend  | React 18, TypeScript, Vite, Apollo Client    |
| Drag/drop | `@dnd-kit`                                    |
| API       | Node.js, Apollo Server 4, GraphQL            |
| Auth      | JWT, bcryptjs                                |
| Database  | MongoDB + Mongoose                           |
| DevOps    | Docker, docker-compose, GitHub Actions CI, Husky + commitlint |

## Architecture

```
frontend (React + Apollo)  ──GraphQL──►  backend (Apollo Server)  ──Mongoose──►  MongoDB
        JWT in Authorization header             context verifies token
```

## Getting started

### Option A — Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- GraphQL API: http://localhost:4000/graphql (subscriptions at ws://localhost:4000/graphql)

### Option B — Run locally

**Prerequisites:** Node.js 20+, a running MongoDB instance.

**Backend**

```bash
cd backend
cp .env.example .env      # set MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

**Frontend**

```bash
cd frontend
cp .env.example .env      # set VITE_API_URL if not default
npm install
npm run dev
```

## Project structure

```
DevBoard/
├── backend/
│   └── src/
│       ├── models/       # Mongoose schemas: User, Board, Column, Card
│       ├── graphql/      # typeDefs + resolvers
│       ├── auth/         # JWT signing + Apollo context
│       ├── utils/        # permission guards
│       └── index.ts      # server entrypoint
├── frontend/
│   └── src/
│       ├── pages/        # Login, Boards, Board (Kanban)
│       ├── components/   # ProtectedRoute
│       ├── auth/         # AuthContext
│       ├── apollo/       # Apollo Client + auth link
│       └── graphql/      # queries & mutations
└── docker-compose.yml
```

## Deploy a live demo

Free-tier stack: **MongoDB Atlas** (database) + **Render** (API) + **Vercel** (frontend).

1. **Database — MongoDB Atlas**
   - Create a free M0 cluster, add a database user, and allow network access.
   - Copy the connection string (`mongodb+srv://…/devboard`).

2. **API — Render** (uses [`render.yaml`](render.yaml))
   - New → Blueprint → select this repo.
   - Set `MONGODB_URI` to your Atlas string; `JWT_SECRET` is auto-generated.
   - Note the deployed URL, e.g. `https://devboard-api.onrender.com`.

3. **Frontend — Vercel** (uses [`frontend/vercel.json`](frontend/vercel.json))
   - Import the repo and set the **root directory** to `frontend`.
   - Add env var `VITE_API_URL` = your Render API URL.
   - Deploy — Vercel auto-detects Vite.

## Roadmap

- [x] Real-time updates via GraphQL subscriptions
- [x] Card labels, due dates & assignees in the UI
- [x] Reorder cards within a column
- [ ] Activity log / audit trail

## Contributing

This repo uses **Husky** git hooks to keep quality consistent.

**Setup** — Node 20 (see [`.nvmrc`](.nvmrc)). Install root deps first (this activates the Husky hooks), then the sub-packages:

```bash
npm install          # root — installs Husky + commitlint + concurrently
npm run install:all  # installs backend + frontend deps
```

**Run both apps** with one command from the root:

```bash
npm run dev          # starts the API and the frontend together
```

**Git hooks**

- `pre-commit` → runs `npm run typecheck` (backend + frontend). Commits with type errors are blocked.
- `commit-msg` → runs [commitlint](https://commitlint.js.org) to enforce [Conventional Commits](https://www.conventionalcommits.org).

**Commit message format**

```
type(optional-scope): description
```

Allowed types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `build`, `ci`.

```bash
# ✅ good
git commit -m "feat: add card detail modal"
git commit -m "fix(board): correct card order on move"

# ❌ rejected
git commit -m "second iteration needed"
```

**Type-check manually**

```bash
npm run typecheck
```

## License

MIT

