# GT5 Trading Platform - Development Guide

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gt5-trading-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration. For local development, the defaults should work fine.

### 4. Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

Check services are running:

```bash
docker-compose ps
```

### 5. Run Database Migrations

Create the database schema:

```bash
npm run migrate
```

### 6. Seed Database (Optional)

Insert demo users and admin account:

```bash
npm run seed
```

This creates:
- Admin user: `admin@gt5trading.com` / `Admin123!`
- Demo user: `demo@gt5trading.com` / `Demo123!`
- Trader user: `trader@gt5trading.com` / `Trader123!`

## Running the Application

### Development Mode

Start the server with hot-reload:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Production Build

Build the TypeScript code:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run Integration Tests Only

```bash
npm run test:integration
```

### Watch Mode

```bash
npm run test:watch
```

## Code Quality

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

### Type Checking

```bash
npm run typecheck
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Authentication

#### Register

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

Response (201):
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "account_type": "demo",
    "balance": "10000.00",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (200): Same as register

#### Refresh Token

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGci..."
}
```

Response (200): Same as register

## Testing with cURL

### Register a new user

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Access Protected Route (Example)

```bash
curl -X GET http://localhost:3000/api/v1/protected-route \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Management

### Connect to PostgreSQL

```bash
docker exec -it gt5_postgres psql -U postgres -d gt5_trading
```

### Common SQL Commands

```sql
-- List all users
SELECT id, email, role, account_type, balance, status FROM users;

-- Check specific user
SELECT * FROM users WHERE email = 'test@example.com';

-- Delete a user
DELETE FROM users WHERE email = 'test@example.com';

-- Reset demo balance
UPDATE users SET balance = 10000.00 WHERE account_type = 'demo';
```

### Connect to Redis

```bash
docker exec -it gt5_redis redis-cli
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database and configuration
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── models/          # Data models
│   ├── database/        # Migrations and seeds
│   ├── utils/           # Utilities (logger, errors, jwt, validation)
│   ├── types/           # TypeScript type definitions
│   └── main.ts          # Application entry point
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── docker-compose.yml   # Docker services
├── Dockerfile           # Production Docker image
├── tsconfig.json        # TypeScript configuration
├── jest.config.js       # Jest configuration
└── package.json         # Dependencies and scripts
```

## Troubleshooting

### Port Already in Use

If port 3000, 5432, or 6379 is already in use:

1. Change ports in `.env`
2. Update `docker-compose.yml` port mappings
3. Restart services

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Clear Database and Start Fresh

```bash
# Stop services
docker-compose down

# Remove volumes
docker volume rm backend_postgres_data

# Start services
docker-compose up -d

# Re-run migrations
npm run migrate

# Re-seed data
npm run seed
```

## Security Notes

- **Never commit `.env` files** to version control
- Change `JWT_SECRET` in production
- Use strong passwords for production databases
- Enable SSL for production database connections
- Implement rate limiting (already configured)
- Use HTTPS in production

## Next Steps (Phase 2+)

- Trading engine implementation
- WebSocket real-time data streaming
- Market data integration
- Charting API
- Strategy scripting engine
- Order management system
- Portfolio tracking

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Run linting and formatting
6. Submit a pull request

## License

MIT
