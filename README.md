# Stream Chat Application

Chat application with real-time AI streaming, JWT authentication, and Gemini LLM integration.

## Architecture

```
Frontend (Next.js) ←→ Backend (FastAPI) ←→ Database (PostgreSQL)
Port: 3000             Port: 8080            Port: 5432
```

## Features

- **Stream Chat**: Real-time AI conversations with Vercel AI SDK
- **Authentication**: JWT tokens with middleware protection
- **AI Integration**: Gemini LLM for intelligent responses

## Tech Stack

**Frontend**: Next.js 15, TypeScript, Tailwind CSS, Vercel AI SDK  
**Backend**: FastAPI, PostgreSQL, SQLAlchemy, JWT  
**Infrastructure**: Docker, Docker Compose

## Quick Start

### 1. Setup
```bash
git clone <https://github.com/infinity-9427/disruptica-stream-chat.git>
cd fs-app
```

### 2. Environment Configuration

Copy and edit environment files:

**Root level (.env.example → .env):**
```env
# Database Configuration
POSTGRES_DB=auth_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_PORT=5432

# API Configuration
API_PORT=8080
FRONTEND_PORT=3000

# Security
SECRET_KEY=your-super-secret-key

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db
DATABASE_ECHO=false
```

**Frontend (.env.local):**
```env
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key
LLM_MODEL=gemini-2.0-flash
```

### 3. Run with Docker
```bash
docker compose up --build -d
```

### 4. Access
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Health check: `curl http://localhost:8080/health`

## API Authentication

### Register
```bash
curl -X POST "http://localhost:8080/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com", 
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### Protected Endpoints
```bash
# Get user profile
curl -X GET "http://localhost:8080/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Stream chat
curl -X POST "http://localhost:8080/api/v1/chat/stream" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello AI!"}'
```

## Project Structure

```
fs-app/
├── api/                     # FastAPI backend
│   ├── controllers/         # Business logic
│   ├── database/           # DB configuration
│   ├── middleware/         # JWT middleware
│   ├── routes/             # API endpoints
│   └── schemas/            # Request/response models
├── frontend/               # Next.js frontend
│   ├── src/app/           # App router pages
│   ├── src/components/    # React components
│   ├── src/contexts/      # Auth context
│   └── src/middleware.ts  # Route protection
└── docker-compose.yml     # Container setup
```

## Development

```bash
# Start services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Authentication Flow

1. User registers/logs in via frontend forms
2. API returns JWT access token
3. Frontend stores token in cookies
4. Middleware protects routes requiring authentication
5. Token included in API requests for protected endpoints

## Troubleshooting

### Container Issues
```bash
# Check status
docker compose ps

# View logs
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Restart services
docker compose restart
```

### Database Issues
```bash
# Connect to database
docker compose exec db psql -U postgres -d auth_db

# Check database logs
docker compose logs db
```

### Build Issues
```bash
# Clean rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Environment Variables
- Ensure `.env` exists in root directory (used by API)
- Ensure `frontend/.env.local` exists (used by frontend)
- Check all required variables are set