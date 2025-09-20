# 🚗 RideShare Backend API

A comprehensive ride-hailing backend system built with **Node.js**, **Express**, **PostgreSQL**, and **Socket.IO**. This production-ready API provides complete ride management, user authentication, real-time tracking, payment processing, and rating systems.

---

## 🌟 **Features**

### **Core Functionality**
- 👤 **User Management** - Multi-role authentication (Riders, Drivers, Admins)
- 🚗 **Ride Management** - Complete ride lifecycle from request to completion
- 💰 **Payment Processing** - Multiple payment methods (Cash, Wallet, Card, UPI)
- ⭐ **Rating System** - Bidirectional rider-driver rating system
- 💳 **Digital Wallet** - Built-in wallet for cashless transactions
- 📍 **Real-time Tracking** - Live GPS tracking during rides
- 🚨 **Admin Panel** - User and ride management dashboard

### **Technical Features**
- 🔐 **JWT Authentication** - Secure token-based authentication
- 🌐 **Socket.IO Integration** - Real-time updates and notifications
- 📊 **Swagger Documentation** - Interactive API documentation
- 🗄️ **Database Migrations** - Automated database schema management
- 🌱 **Database Seeders** - Demo data for development and testing
- 🚦 **Rate Limiting** - API protection and abuse prevention
- 📝 **Comprehensive Logging** - Winston-based logging system
- ⚡ **Redis Caching** - High-performance data caching
- 🐳 **Docker Ready** - Containerization support

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React/Web)   │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Redis Cache   │
                    │   (Sessions)    │
                    └─────────────────┘
```

### **Database Models**
- **Users** - Base authentication and user management
- **Riders** - Rider profiles and preferences  
- **Drivers** - Driver profiles and operational status
- **Vehicles** - Vehicle registration and documents
- **Rides** - Core ride management and lifecycle
- **Payments** - Payment processing and transactions
- **Ratings** - Mutual rating system
- **Wallets** - Digital wallet system
- **WalletTransactions** - Transaction history and audit trail
- **DriverLocations** - Historical GPS tracking
- **RideTracking** - Real-time ride location updates

---

## 🛠️ **Technology Stack**

### **Backend**
- **Node.js** (v18+) - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Sequelize** - ORM for database operations
- **Redis** - Caching and session management
- **Socket.IO** - Real-time communication

### **Security & Authentication**
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection

### **Development Tools**
- **Nodemon** - Development server
- **Winston** - Logging
- **Joi** - Input validation
- **Swagger** - API documentation

---

## 📋 **Prerequisites**

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v13 or higher) - [Download here](https://www.postgresql.org/download/)
- **Redis** (v6 or higher) - [Download here](https://redis.io/download)
- **Git** - [Download here](https://git-scm.com/)

---

## 🚀 **Quick Start**

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/rideshare-backend.git
cd rideshare-backend
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
Copy the environment template and configure your settings:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_NAME=rideshare_dev
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_PORT=5432

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# API Configuration
FRONTEND_URL=http://localhost:3000
```

### **4. Database Setup**
Create your PostgreSQL database:
```sql
CREATE DATABASE rideshare_dev;
```

### **5. Run Database Migrations**
```bash
npm run db:migrate
```

### **6. Seed Database (Optional)**
Add demo data for development:
```bash
npm run db:seed
```

### **7. Start the Server**
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

---

## 📖 **API Documentation**

Once the server is running, you can access:

- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health
- **Root Endpoint**: http://localhost:3000/

---

## 🔧 **Available Scripts**

```bash
# Development
npm run dev          # Start development server with nodemon
npm start           # Start production server

# Database
npm run db:migrate  # Run database migrations
npm run db:seed     # Run database seeders
npm run db:reset    # Reset database (drop, create, migrate, seed)

# Database Rollback
npm run db:migrate:undo    # Undo last migration
npm run db:seed:undo       # Undo all seeders

```

---

## 🗂️ **Project Structure**

```
rideshare-backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── app.js       # Application configuration
│   │   ├── database.js  # Database configuration
│   │   └── redis.js     # Redis configuration
│   │
│   ├── controllers/     # Request handlers
│   │   ├── authController.js
│   │   ├── rideController.js
│   │   ├── driverController.js
│   │   ├── paymentController.js
│   │   └── adminController.js
│   │
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # Authentication middleware
│   │   ├── validation.js # Input validation
│   │   ├── rateLimiter.js # Rate limiting
│   │   └── errorHandler.js # Error handling
│   │
│   ├── models/          # Database models (Sequelize)
│   │   ├── User.js
│   │   ├── Rider.js
│   │   ├── Driver.js
│   │   ├── Vehicle.js
│   │   ├── Ride.js
│   │   └── ...
│   │
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── rideRoutes.js
│   │   ├── driverRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── services/        # Business logic
│   │   ├── authService.js
│   │   ├── rideService.js
│   │   ├── paymentService.js
│   │   └── notificationService.js
│   │
│   ├── utils/           # Utility functions
│   │   ├── logger.js    # Winston logger
│   │   ├── validation.js # Joi validation schemas
│   │   └── helpers.js   # Helper functions
│   │
│   ├── migrations/      # Database migrations
│   ├── seeders/         # Database seeders
│   ├── uploads/         # File uploads
│   │
│   └── app.js          # Main application file
├── .env.example        # Environment template
├── .sequelizerc        # Sequelize configuration
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

---

## 🔐 **Authentication**

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### **Demo Login Credentials**

| Role | Phone | Password | Status |
|------|--------|----------|---------|
| **Admin** | 9999999999 | admin123 | Active |
| **Rider** | 9876543210 | password123 | Active |
| **Rider** | 9876543211 | password123 | Active |
| **Driver** | 9876543213 | password123 | Online & Available |
| **Driver** | 9876543214 | password123 | Offline |


## 📊 **Database Schema**

The database includes 11 main tables with proper relationships:

1. **users** - Base user authentication
2. **riders** - Rider profiles and preferences
3. **drivers** - Driver profiles and status
4. **wallets** - Digital wallet system
5. **vehicles** - Vehicle registration
6. **rides** - Core ride data
7. **payments** - Payment transactions
8. **ratings** - Rating system
9. **wallet_transactions** - Transaction history
10. **driver_locations** - GPS tracking history
11. **ride_tracking** - Real-time location data

---

## 🐳 **Docker Setup**

### **Using Docker Compose**
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

### **Manual Docker Build**
```bash
# Build image
docker build -t rideshare-api .

# Run container
docker run -p 3000:3000 --env-file .env rideshare-api
```

---

## 📈 **Performance & Scaling**

### **Optimization Features**
- **Redis Caching** - Session and data caching
- **Database Indexing** - Optimized query performance
- **Connection Pooling** - Efficient database connections
- **Rate Limiting** - API protection
- **Compression** - Response compression
- **Static File Serving** - Efficient asset delivery

### **Monitoring**
- **Health Checks** - `/health` endpoint
- **Logging** - Winston-based comprehensive logging
- **Error Tracking** - Structured error handling

---

## 🛡️ **Security Features**

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Joi schema validation
- **SQL Injection Protection** - Sequelize ORM protection
- **CORS Configuration** - Cross-origin security
- **Rate Limiting** - API abuse prevention
- **Helmet Security Headers** - HTTP security headers
- **File Upload Security** - Multer with file type validation

---

## 🚀 **Deployment**

### **Environment Setup**
1. **Production Database** - Set up PostgreSQL instance
2. **Redis Instance** - Configure Redis for caching
3. **Environment Variables** - Set production values
4. **SSL Certificates** - Configure HTTPS
5. **Process Management** - Use PM2 or similar

### **Production Commands**
```bash
# Install production dependencies only
npm ci --production

# Run database migrations
npm run db:migrate

# Start with PM2
pm2 start ecosystem.config.js

# Or start directly
npm start
```

## 🙏 **Acknowledgments**

- **Express.js** - Fast, unopinionated web framework
- **Sequelize** - Feature-rich ORM for Node.js
- **Socket.IO** - Real-time bidirectional event-based communication
- **PostgreSQL** - Advanced open-source relational database
- **Redis** - In-memory data structure store

---
