# INEE Auction Platform

A full-stack real-time auction platform built with React (Vite), Node.js (Express), PostgreSQL, Redis, and Socket.IO. Designed for live bidding, seller decisions, and real-time notifications.

## Monorepo Structure

```
INEE/
├── backend/    # Node.js Express API, Socket.IO, PostgreSQL, Redis
├── frontend/   # React (Vite) SPA client
├── Dockerfile  # Multi-stage: builds frontend, serves via backend
├── .dockerignore
└── README.md   # (this file)
```

## Tech Stack
- **Frontend:** React 19, Vite, TailwindCSS, Socket.IO-client
- **Backend:** Node.js, Express 5, Socket.IO, Sequelize (PostgreSQL), Redis, SendGrid
- **Database:** PostgreSQL
- **Cache/Queue:** Redis
- **Notifications:** Real-time (Socket.IO) + Email (SendGrid)
- **Containerization:** Docker (single image, multi-stage build)

## Quick Start (Docker)

1. Build the image:
   ```bash
   docker build -t inee-app .
   ```
2. Run the container (set env vars as needed):
   ```bash
   docker run --rm -p 5000:5000 \
     -e PORT=5000 \
     -e FRONTEND_URL=http://localhost:5000 \
     -e DATABASE_URL=postgres://user:pass@host:5432/dbname \
     -e REDIS_URL=redis://:password@host:6379 \
     -e JWT_SECRET=your_jwt_secret \
     -e SENDGRID_API_KEY=your_sendgrid_api_key \
     inee-app
   ```
3. Visit [http://localhost:5000](http://localhost:5000)

## Deployment: Render.com
- Push to GitHub
- Create a new Web Service on Render, select Docker, set build/start as per Dockerfile
- Set all required environment variables (see `/backend/README.md`)
- Attach managed Postgres/Redis or provide connection strings
- Set `FRONTEND_URL` to your Render service URL

## Subproject Docs
- [backend/README.md](backend/README.md): API specs, env, DB, technicals
- [frontend/README.md](frontend/README.md): SPA setup, structure, env

---

© 2025 INEE Auction Platform
