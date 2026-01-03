# 🚀 GT5 Trading Platform - Quick Start Guide

## ✅ Prerequisites Check

You've already completed the setup! Here's what's been configured:

- ✅ Docker containers (PostgreSQL & Redis) are running
- ✅ Database migrations completed
- ✅ Trading instruments seeded (14 instruments)
- ✅ Demo users created
- ✅ Backend compiled and ready

## 🎯 Start the Platform

### Option 1: Development Mode (Recommended)

**Terminal 1 - Backend API:**
```bash
cd backend
npm run dev
```
The API will start on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
node server.js
```
The frontend will start on `http://localhost:8080`

### Option 2: Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
node server.js
```

## 🔐 Demo Accounts

Login with any of these pre-configured accounts:

| Email | Password | Type | Balance |
|-------|----------|------|---------|
| `demo@gt5trading.com` | `Demo123!` | Demo | $10,000 |
| `trader@gt5trading.com` | `Trader123!` | Demo | $25,000 |
| `admin@gt5trading.com` | `Admin123!` | Live | $1,000,000 |

## 🌐 Access the Platform

1. Open your browser
2. Navigate to: **http://localhost:8080**
3. Login with one of the demo accounts above
4. Start trading!

## 📊 Features Available

### ✅ Authentication
- User registration
- Login/Logout
- JWT token authentication
- Secure password hashing

### ✅ Trading Platform
- **14 Trading Instruments**:
  - Forex: EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, USDCHF
  - Crypto: BTCUSD, ETHUSD
  - Indices: US30, SPX500, NAS100
  - Commodities: XAUUSD (Gold), XAGUSD (Silver), USOIL

- **Real-time Market Data**:
  - Live price updates via WebSocket
  - Bid/Ask spread
  - Real-time price movements

- **Order Management**:
  - Market orders (instant execution)
  - Limit orders
  - Order history
  - Cancel pending orders

- **Position Tracking**:
  - View open positions
  - Real-time P&L calculation
  - Position details (entry price, current price, quantity)

- **Account Dashboard**:
  - Balance tracking
  - Equity calculation
  - Unrealized P&L
  - Open positions count

## 🛠️ API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token

### Trading
- `GET /api/v1/trading/instruments` - List all instruments
- `GET /api/v1/trading/market-data` - Get real-time market prices
- `GET /api/v1/trading/account` - Get account details
- `GET /api/v1/trading/positions` - List open positions
- `GET /api/v1/trading/orders` - List orders
- `POST /api/v1/trading/orders` - Place new order
- `DELETE /api/v1/trading/orders/:id` - Cancel order

### WebSocket
- `ws://localhost:3000/ws` - Real-time market data stream

## 🧪 Testing the Platform

### 1. Register a New Account
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@gt5trading.com",
    "password": "Demo123!"
  }'
```

### 3. Get Market Data
```bash
curl http://localhost:3000/api/v1/trading/market-data \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Place an Order
```bash
curl -X POST http://localhost:3000/api/v1/trading/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instrument_id": 1,
    "order_type": "market",
    "side": "buy",
    "quantity": 1.0
  }'
```

## 📁 Project Structure

```
gt5-trading-platform/
├── backend/                 # Node.js/TypeScript API
│   ├── src/
│   │   ├── config/         # Database & configuration
│   │   ├── middleware/     # Auth & error handling
│   │   ├── services/       # Business logic
│   │   │   ├── auth/       # Authentication services
│   │   │   ├── trading/    # Trading services
│   │   │   └── websocket/  # WebSocket services
│   │   ├── routes/         # API endpoints
│   │   ├── database/       # Migrations & seeds
│   │   ├── utils/          # Utilities
│   │   └── types/          # TypeScript types
│   ├── tests/              # Unit & integration tests
│   └── docker-compose.yml  # PostgreSQL + Redis
│
├── frontend/               # Vanilla JS SPA
│   ├── public/
│   │   ├── index.html     # Main HTML
│   │   └── styles.css     # Styling
│   ├── src/
│   │   ├── services/      # API client
│   │   ├── pages/         # Login & Dashboard
│   │   └── main.js        # App initialization
│   └── server.js          # Static file server
│
└── mobile/                 # Flutter app (future)
```

## 🔧 Useful Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm start            # Start production server
npm test             # Run tests
npm run migrate      # Run user migrations
npm run migrate:trading  # Run trading migrations
npm run seed         # Seed demo users
npm run seed:trading # Seed trading instruments
npm run setup        # Run all migrations & seeds
```

### Database
```bash
# Connect to PostgreSQL
docker exec -it gt5_postgres psql -U postgres -d gt5_trading

# Check users
SELECT email, balance, account_type FROM users;

# Check instruments
SELECT symbol, name, type FROM instruments;

# Check orders
SELECT o.id, u.email, i.symbol, o.side, o.quantity, o.status 
FROM orders o 
JOIN users u ON o.user_id = u.id 
JOIN instruments i ON o.instrument_id = i.id;
```

### Docker
```bash
docker compose ps         # Check services status
docker compose logs -f    # View logs
docker compose down       # Stop services
docker compose up -d      # Start services
```

## 🎨 How to Use the Platform

1. **Login** - Use one of the demo accounts
2. **View Dashboard** - See your balance, equity, and market data
3. **Monitor Markets** - Real-time prices update every second
4. **Place Orders**:
   - Select an instrument
   - Choose Buy or Sell
   - Enter quantity
   - Select Market or Limit order
   - Click "Place Order"
5. **Track Positions** - View your open positions and P&L
6. **Manage Orders** - View order history and cancel pending orders

## 🐛 Troubleshooting

### Port Already in Use
If ports 3000 or 8080 are in use:
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

### Database Connection Issues
```bash
# Restart Docker containers
cd backend
docker compose restart

# Check container status
docker compose ps

# View logs
docker compose logs postgres
```

### Reset Everything
```bash
# Stop all services
docker compose down -v

# Start fresh
docker compose up -d
npm run setup
```

## 📈 Next Steps

The platform is now ready for:
- Advanced charting (Phase 3)
- Technical indicators
- Strategy scripting
- Backtesting framework
- Mobile app (Flutter)
- Production deployment

## 🎉 You're All Set!

The GT5 Trading Platform is fully functional and ready to use!

**Open http://localhost:8080 in your browser and start trading!**

---

Need help? Check the logs in the backend terminal for detailed error messages.
