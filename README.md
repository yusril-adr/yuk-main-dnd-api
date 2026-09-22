# requestor-api

NestJS REST API for managing users, requests, and audit logs with JWT auth.

## Prerequisites

- Node.js v24.9.0 (see `.nvmrc`)
- Docker + Docker Compose
- npm

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url> && cd requestor-api
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` if needed — DB credentials, JWT secret, etc.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Run migrations

```bash
npm run migration:run
```

### 5. Run seeders

```bash
npm run seed
```

Seeders create 10 users (1 admin, 1 operator, 8 viewers) and 10 requests.

### 6. Start the app

```bash
npm run start:dev
```

App runs at `http://localhost:8000` with API prefix `/api/v1`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Dev server with hot reload |
| `npm run start:prod` | Production build & start |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:generate` | Generate migration from entity changes |
| `npm run migration:revert` | Revert last migration |
| `npm run seed` | Run database seeders |

## API Modules

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/v1/auth/login` | Public | Login with email & password |
| `GET /api/v1/auth/me` | Bearer token | Get current user |
| `GET /api/v1/users` | Bearer token | List users (paginated) |
| `GET /api/v1/users/:id` | Bearer token | Get user by ID |
| `POST /api/v1/users` | Admin, Operator | Create user |
| `PATCH /api/v1/users/:id` | Admin, Operator | Update user |
| `DELETE /api/v1/users/:id` | Admin, Operator | Soft-delete user |
| `GET /api/v1/requests` | Bearer token | List requests (paginated) |
| `GET /api/v1/requests/:id` | Bearer token | Get request by ID |
| `POST /api/v1/requests` | Admin | Create request |
| `PATCH /api/v1/requests/:id` | Admin | Update request |
| `DELETE /api/v1/requests/:id` | Admin | Soft-delete request |
| `GET /api/v1/audit-logs` | Bearer token | List audit logs (paginated) |

## Tech Stack

NestJS 11 · TypeORM · PostgreSQL 17 · JWT · bcrypt · class-validator · dayjs · typeorm-extension
