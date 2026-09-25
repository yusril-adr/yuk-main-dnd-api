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
| `POST /api/v1/files/upload` | Bearer token | Upload a file |
| `GET /api/v1/files/download/:id` | Public | Generate a signed download URL |

### File storage

Configure Supabase Storage in `.env`:

```env
STORAGE_DRIVER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SUPABASE_SIGNED_URL_EXPIRES_IN=900
FILE_USER_AVATAR_BUCKET=your-avatar-bucket
FILE_OTHER_BUCKET=your-other-files-bucket
FILE_USER_AVATAR_PATH_PREFIX=users
FILE_USER_AVATAR_MAX_FILE_SIZE_BYTES=10485760
FILE_OTHER_PATH_PREFIX=others
FILE_OTHER_MAX_FILE_SIZE_BYTES=10485760
```

Upload a file using the authenticated user's access token:

```bash
curl -X POST http://localhost:8000/api/v1/files/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "purpose=others" \
  -F 'metadata={}' \
  -F "file=@./example.png"
```

User avatars are always uploaded as temporary files. The upload response contains `status: "temporary"`; pass its ID as `avatar_file_id` when creating a user or replacing an existing avatar. The user write promotes it to the user's avatar path and changes its status to `"active"`:

```bash
curl -X POST http://localhost:8000/api/v1/files/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "purpose=user_avatar" \
  -F 'metadata={}' \
  -F "file=@./avatar.png"

curl -X POST http://localhost:8000/api/v1/master/iam/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.user@example.com",
    "password": "StrongPassword123!",
    "display_name": "New User",
    "avatar_file_id": "temporary-file-uuid"
  }'
```

To replace an existing user avatar, upload a new temporary avatar, then update the user:

```bash
curl -X POST http://localhost:8000/api/v1/files/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "purpose=user_avatar" \
  -F 'metadata={}' \
  -F "file=@./avatar.png"

curl -X PATCH http://localhost:8000/api/v1/master/iam/users/user-uuid \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"avatar_file_id":"temporary-file-uuid"}'
```

`metadata.target_id` is not supported for user-avatar uploads.

Generate a signed download URL:

```bash
curl http://localhost:8000/api/v1/files/download/<file-id>
```

## Tech Stack

NestJS 11 · TypeORM · PostgreSQL 17 · JWT · bcrypt · class-validator · dayjs · typeorm-extension
