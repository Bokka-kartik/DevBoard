# DevBoard

A full-stack **team task & project board** (Trello-style Kanban) built with React, GraphQL, and MongoDB. Create boards, organize work into columns, and drag cards between stages — with JWT authentication and multi-user collaboration.

![Tech](https://img.shields.io/badge/React-18-61dafb) ![Tech](https://img.shields.io/badge/TypeScript-5-3178c6) ![Tech](https://img.shields.io/badge/GraphQL-Apollo-e10098) ![Tech](https://img.shields.io/badge/MongoDB-7-47a248) ![Tech](https://img.shields.io/badge/Docker-ready-2496ed)

## Features

- 🔐 **Authentication** — register & login with JWT, hashed passwords (bcrypt)
- 📋 **Boards** — create, rename, and delete boards
- 🧱 **Columns** — organize work into stages (To Do / In Progress / Done seeded by default)
- 🃏 **Cards** — add tasks with title & description
- 🖱️ **Drag & drop** — move cards between columns (`@dnd-kit`)
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
| DevOps    | Docker, docker-compose, GitHub Actions CI    |

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
- GraphQL API: http://localhost:4000

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

## Roadmap

- [ ] Real-time updates via GraphQL subscriptions
- [ ] Card labels, due dates & assignees in the UI
- [ ] Reorder cards within a column
- [ ] Activity log / audit trail

## License

MIT
