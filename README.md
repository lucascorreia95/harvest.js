# 🌾 Harvest.js

A Full-Stack Farm Simulation Engine
Harvest.js is a modern reimagining of the classic "Social Farm" genre (popularized by titles like Happy Farm). This project serves as a technical showcase for building a real-time, persistent state application with a focus on clean architecture, time-based logic, and scalability.

## 🎯 Project Purpose

The goal of Harvest.js is to move beyond simple CRUD applications. It demonstrates the ability to manage complex game loops, where the state of the application changes even when the user is offline (e.g., plants growing over time).

### Key Technical Challenges:

- Time-Synchronization: Calculating growth stages based on server-side timestamps to prevent client-side manipulation.

- State Management: Handling a dynamic grid of "plots" with different growth cycles.

- Monorepo Architecture: Ensuring a seamless developer experience by sharing types and logic between the frontend and backend.

## 🚀 Current State - Farm Simulation Core

### ✅ Completed Features:

**Authentication & Profile:**
- **Database Schema**: User, Profile, and Session models with Prisma ORM
- **Backend API**: NestJS with JWT authentication and passport strategies
- **Frontend UI**: React with Tailwind CSS, authentication forms, and dashboard
- **Authentication Flow**: Registration, login, logout, and profile management
- **Game Elements**: Level system, experience points, coins, and farm naming

**Farm System:**
- **Plot Grid**: 28 unlockable plots with progressive pricing
- **Planting**: Plant seeds from inventory or buy directly when planting
- **Growth System**: Time-based crop growth with server-side timestamps
- **Watering**: Water crops to gain XP immediately and bonus XP/time on harvest
- **Pests**: Random pest appearance (35% chance after 50% growth time) that slows growth by 50%
- **Pesticide**: Remove pests with pesticide to restore normal growth and gain XP
- **Harvesting**: Harvest crops when ready, earn XP and collect produce
- **Experience**: XP rewards on harvest with automatic level progression

**Shop System:**
- **Item Catalog**: Dynamic catalog with seeds, crops, fertilizers, tools, animals
- **Seed Shop**: Seeds with growth time, XP rewards, profit calculations, and coins per minute
- **Buying**: Purchase items with automatic inventory management
- **Price Validation**: Level requirements and affordability checks

**Inventory System:**
- **Inventory Management**: Track all owned items with quantities
- **Selling**: Sell items from inventory to earn coins
- **Type Filtering**: Filter by item type (SEED, CROP, etc.)
- **Item Details**: Growth time, XP rewards, buy/sell prices

**Activity Logging:**
- **Comprehensive Logs**: Track all player actions (plant, harvest, unlock, level up, earn/spend coins, earn XP, buy/feed/collect/sell animals, water, spray)
- **Activity Stats**: Queryable statistics by action type
- **Recent Activities**: Global activity feed
- **Audit Trail**: Complete history of player transactions

**Animal System:**
- **Animal Ownership**: One animal per type per player (chicken, pig, cow)
- **Feeding**: Feed animals with specific food to trigger production
- **Production**: Animals produce items after time (chicken → egg, cow → milk)
- **Collection**: Collect animal products when ready
- **Pig Growth**: Pigs gain weight when fed and can be sold at maximum weight
- **Animal Shop**: Buy animals and animal food from the shop

### 🏗️ Architecture:

```
harvest.js/
├── apps/
│   ├── server/          # NestJS Backend API
│   └── web/             # React Frontend
├── packages/
│   └── database/        # Prisma Database Layer
└── docker-compose.yml   # PostgreSQL Container
```

## 🛠️ Tech Stack

### Backend (apps/server):

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport.js
- **Security**: bcryptjs for password hashing

### Frontend (apps/web):

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom theme
- **HTTP Client**: Axios
- **UI Components**: Headless UI & Heroicons

### Database:

- **PostgreSQL 15** running in Docker container
- **Prisma** for type-safe database access

## 📋 Setup Instructions

### Prerequisites:

- Node.js (v20+)
- Docker & Docker Compose
- npm

### 1. Clone and Install:

```bash
git clone <repository-url>
cd harvest.js
npm install
```

### 2. Start Database:

```bash
docker-compose up -d
```

### 3. Setup Backend:

```bash
cd apps/server
cp .env.example .env
# Edit .env with your configuration
npm install
```

### 4. Setup Database Schema:

```bash
npm run db:generate
npm run db:push
```

### 5. Start Development Servers:

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev -w apps/server  # Backend on :3000
npm run dev -w apps/web     # Frontend on :5173
```

## 🔧 Environment Configuration

### Backend (.env):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/harvest_db"
JWT_SECRET="your-super-secret-jwt-key-here"
FRONTEND_URL="http://localhost:5173"
PORT=3000
```

## 🎮 API Endpoints

### Authentication:

- `POST /auth/register` - Create new user account
- `POST /auth/login` - Sign in existing user
- `POST /auth/logout` - Sign out user
- `GET /auth/profile` - Get current user profile

### Users:

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile (displayName, avatar, bio, farmName)

### Farm:

- `GET /farm` - Get farm state (plots and crops, including pest information)
- `POST /farm/unlock` - Unlock a plot (costs coins)
- `POST /farm/plant` - Plant a seed in a plot (uses inventory or buys directly, determines pest chance)
- `POST /farm/water` - Water a crop (gains XP and time/XP bonus on harvest)
- `POST /farm/spray` - Remove pest from crop (gains XP and removes growth penalty)
- `POST /farm/harvest` - Harvest a mature crop (earns XP and produce)

### Shop:

- `GET /shop` - Get shop items (optional filter: `?type=SEED|FERTILIZER|TOOL|ANIMAL`)
- `GET /shop/seeds` - Get only seeds from shop
- `GET /shop/catalog` - Get full catalog grouped by category
- `POST /shop/buy` - Buy items from shop (itemSlug, quantity)

### Inventory:

- `GET /inventory` - Get user inventory (optional filter: `?type=SEED|CROP`)
- `POST /inventory/sell` - Sell items from inventory (itemSlug, quantity)

### Activity:

- `GET /activity` - Get user activities (pagination and action filter)
- `GET /activity/stats` - Get activity statistics by action type
- `GET /activity/recent` - Get recent global activities

### Animals:

- `GET /animals` - Get user's animals with status
- `POST /animals/buy` - Buy an animal (animalSlug)
- `POST /animals/feed` - Feed an animal (animalSlug)
- `POST /animals/collect` - Collect animal product (animalSlug)
- `POST /animals/sell` - Sell animal (only pigs at max weight) (animalSlug)

## 🎮 Game Mechanics

### Watering System

- **Cooldown**: Each crop has a water duration (e.g., 10s for wheat, 30s for carrot, 60s for corn)
- **XP Bonus**: Immediate 1 XP per watering + bonus XP on harvest (e.g., +2 XP per watering for wheat)
- **Time Bonus**: Each watering reduces growth time (e.g., -5s per watering for wheat)
- **Tool**: Copper watering can is given to all new players (non-consumable, not sellable)

### Pest System

- **Appearance**: Pests are determined at planting time (35% chance)
- **Timing**: Pests appear at 50% of growth time if triggered
- **Effect**: Pests slow down growth by 50% of the original growth time
- **Limit**: Only one pest per plant per growth cycle
- **Removal**: Use pesticide to remove pests (gains 2 XP)
- **Tool**: Natural pesticide is given to all new players (non-consumable, not sellable)

### Example Growth Cycle (Wheat)

- **Base**: 30s growth time, 5 XP
- **Watered 3x**: 15s effective growth time (30 - 3×5), 11 XP total (5 + 3×2)
- **With pest**: 45s effective growth time (30 + 50% penalty), 5 XP
- **Pest removed**: Returns to normal growth time
- **Frontend knows**: From planting moment if pest will appear and when

## 🧪 Testing the System

1. **Register**: Create a new account at http://localhost:5173
2. **Login**: Sign in with your credentials
3. **Dashboard**: View your profile, level, coins, and experience
4. **Profile**: Update your display name, avatar, bio, and farm name
5. **Farm**: View your plots, unlock new plots, plant seeds, water crops, and harvest crops
6. **Shop**: Browse items, buy seeds, fertilizers, tools, animals, and food
7. **Inventory**: View your items, sell harvested crops and animal products
8. **Animals**: Buy animals, feed them, collect products, sell pigs
9. **Activity**: View your activity history and statistics

## 🔄 Next Steps (Future Features)

**Completed (Sprints 1-5):**
- ✅ Authentication & Profile System
- ✅ Farm grid system and crop planting mechanics
- ✅ Time-based growth and harvesting
- ✅ Shop system with item catalog
- ✅ Inventory management and selling
- ✅ Activity logging and statistics
- ✅ Animal system (chickens, pigs, cows)
- ✅ Watering system with XP and time bonuses
- ✅ Pest system with random appearance and growth penalty

**Planned (Future Sprints):**
- **Sprint 5**: Fertilizers and growth acceleration
- **Sprint 6**: Tools and equipment system
- **Sprint 7**: Market system and trading between players
- **Sprint 8**: Social features (friends, leaderboards, visiting farms)
- **Sprint 9**: Achievements and quests
- **Sprint 10**: Premium currency and monetization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
