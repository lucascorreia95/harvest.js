# 🌾 Harvest.js

A Full-Stack Farm Simulation Engine
Harvest.js is a modern reimagining of the classic "Social Farm" genre (popularized by titles like Happy Farm). This project serves as a technical showcase for building a real-time, persistent state application with a focus on clean architecture, time-based logic, and scalability.

## 🎯 Project Purpose

The goal of Harvest.js is to move beyond simple CRUD applications. It demonstrates the ability to manage complex game loops, where the state of the application changes even when the user is offline (e.g., plants growing over time).

### Key Technical Challenges:

- Time-Synchronization: Calculating growth stages based on server-side timestamps to prevent client-side manipulation.

- State Management: Handling a dynamic grid of "plots" with different growth cycles.

- Monorepo Architecture: Ensuring a seamless developer experience by sharing types and logic between the frontend and backend.

## 🚀 Sprint 1 MVP - Authentication & Profile System

### ✅ Completed Features:

- **Database Schema**: User, Profile, and Session models with Prisma ORM
- **Backend API**: NestJS with JWT authentication and passport strategies
- **Frontend UI**: React with Tailwind CSS, authentication forms, and dashboard
- **Authentication Flow**: Registration, login, logout, and profile management
- **Game Elements**: Level system, experience points, coins, and farm naming

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

- `PUT /users/profile` - Update user profile

## 🧪 Testing the System

1. **Register**: Create a new account at http://localhost:5173
2. **Login**: Sign in with your credentials
3. **Dashboard**: View your profile and farm stats
4. **Profile**: Update your display name and farm name

## 🔄 Next Steps (Future Sprints)

- **Sprint 2**: Farm grid system and crop planting mechanics
- **Sprint 3**: Time-based growth and harvesting
- **Sprint 4**: Market system and trading
- **Sprint 5**: Social features and multiplayer elements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
