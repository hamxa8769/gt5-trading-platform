# GT5 Trading Platform

Open-source trading platform inspired by MetaTrader 5, featuring charting, strategy scripting, and market data integration.

## 🚀 Features (Phase 0 & 1 - MVP)

- ✅ **Authentication System**: Secure JWT-based authentication with refresh tokens
- ✅ **User Management**: Registration, login, and account management
- ✅ **Demo Trading Accounts**: Start with $10,000 virtual balance
- ✅ **Production-Ready Backend**: TypeScript, Express, PostgreSQL, Redis
- ✅ **Comprehensive Testing**: Unit and integration tests with Jest
- ✅ **Security First**: bcrypt password hashing, Helmet, CORS, rate limiting
- ✅ **Docker Support**: Containerized PostgreSQL and Redis setup

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- PostgreSQL 16
- Redis 7

## 🏗️ Project Structure

```
gt5-trading-platform/
├── backend/              # Node.js/TypeScript API
│   ├── src/
│   │   ├── config/      # Database configuration
│   │   ├── middleware/  # Express middleware
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API endpoints
│   │   ├── database/    # Migrations & seeds
│   │   ├── utils/       # Utilities
│   │   └── types/       # TypeScript types
│   ├── tests/           # Unit & integration tests
│   └── docker-compose.yml
├── mobile/              # Flutter app (future)
└── DEVELOPMENT.md       # Detailed setup guide
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Database Services

```bash
docker-compose up -d
```

### 3. Run Migrations

```bash
npm run migrate
```

### 4. Seed Demo Data (Optional)

```bash
npm run seed
```

This creates demo accounts:
- Admin: `admin@gt5trading.com` / `Admin123!`
- Demo: `demo@gt5trading.com` / `Demo123!`

### 5. Start Development Server

```bash
npm run dev
```

API available at: `http://localhost:3000`

## 📚 Documentation

See [DEVELOPMENT.md](./DEVELOPMENT.md) for:
- Detailed setup instructions
- API documentation
- Testing guide
- Database management
- Troubleshooting

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

## 🔒 Security Features

- ✅ JWT access tokens (15 min expiry)
- ✅ JWT refresh tokens (7 day expiry)
- ✅ bcrypt password hashing (10 rounds)
- ✅ Input validation with Joi
- ✅ Rate limiting (100 requests per 15 min)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Secure password requirements (min 8 chars)

## 🌐 API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST /api/v1/auth/register  # Register new user
POST /api/v1/auth/login     # Login user
POST /api/v1/auth/refresh   # Refresh access token
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Logging**: Winston

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: Ready for GitHub Actions
- **Linting**: ESLint
- **Formatting**: Prettier

## 📈 Roadmap

### ✅ Phase 0: Infrastructure Setup
- Repository structure
- Docker configuration
- TypeScript setup
- Testing framework

### ✅ Phase 1: Authentication & Core API
- User registration & login
- JWT token management
- Database migrations
- Error handling
- Logging

### 🔜 Phase 2: Trading Engine (Coming Soon)
- Market data integration
- Order management system
- Real-time WebSocket streaming
- Portfolio tracking

### 🔜 Phase 3: Advanced Features
- Charting API
- Technical indicators
- Strategy scripting engine
- Backtesting framework

### 🔜 Phase 4: Mobile App
- Flutter mobile application
- Real-time trading interface
- Push notifications

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 👥 Authors

GT5 Platform Team

## 🙏 Acknowledgments

Inspired by MetaTrader 5 and modern trading platforms.

---

**Status**: Phase 0 & 1 Complete ✅  
**Next**: Phase 2 - Trading Engine Development
