require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import configurations
// const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const driverRoutes = require('./routes/driverRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import models to initialize database
const db = require('./models');

// Import services
const NotificationService = require('./services/notificationService');

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.IO setup
// const io = socketIo(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "*",
//     methods: ["GET", "POST"],
//     credentials: true
//   },
//   transports: ['websocket', 'polling']
// });

// // Swagger configuration
// const swaggerOptions = {
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'RideShare API',
//       version: '1.0.0',
//       description: 'A comprehensive ride-hailing backend API built with Node.js, Express, and PostgreSQL',
//       contact: {
//         name: 'RideShare Team',
//         email: 'dev@rideshare.com'
//       }
//     },
//     servers: [
//       {
//         url: `http://localhost:${process.env.port}`,
//         description: 'Development server'
//       }
//     ],
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT'
//         }
//       }
//     }
//   },
//   apis: ['./src/routes/*.js'], // Path to the API docs
// };

// const specs = swaggerJsdoc(swaggerOptions);

// Middleware setup
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.nodeEnv,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RideShare API Documentation'
}));

// Serve uploaded files
app.use('/uploads', express.static(process.env.uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to RideShare API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      rides: '/api/rides',
      driver: '/api/driver',
      payments: '/api/payments',
      ratings: '/api/ratings',
      admin: '/api/admin'
    }
  });
});

// Socket.IO connection handling
// io.on('connection', (socket) => {
//   logger.info(`Client connected: ${socket.id}`);

//   // Join room for ride updates
//   socket.on('join_ride', (rideId) => {
//     socket.join(`ride_${rideId}`);
//     logger.info(`Client ${socket.id} joined ride room: ${rideId}`);
//   });

//   // Leave ride room
//   socket.on('leave_ride', (rideId) => {
//     socket.leave(`ride_${rideId}`);
//     logger.info(`Client ${socket.id} left ride room: ${rideId}`);
//   });

//   // Handle driver location updates
//   socket.on('driver_location_update', (data) => {
//     const { rideId, location } = data;
//     if (rideId && location) {
//       // Broadcast location to ride participants
//       socket.to(`ride_${rideId}`).emit('driver_location_update', {
//         rideId,
//         location,
//         timestamp: new Date().toISOString()
//       });
//     }
//   });

//   // Handle ride status updates
//   socket.on('ride_status_update', (data) => {
//     const { rideId, status, message } = data;
//     if (rideId && status) {
//       // Broadcast status to ride participants
//       io.to(`ride_${rideId}`).emit('ride_status_update', {
//         rideId,
//         status,
//         message,
//         timestamp: new Date().toISOString()
//       });
//     }
//   });

//   // Handle disconnection
//   socket.on('disconnect', () => {
//     logger.info(`Client disconnected: ${socket.id}`);
//   });

//   // Handle connection errors
//   socket.on('error', (error) => {
//     logger.error(`Socket error for ${socket.id}:`, error);
//   });
// });

// Make io accessible to other parts of the application
// app.set('io', io);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Initialize application
async function initializeApp() {
  try {
    // Connect to Redis
    // await connectRedis();
    // logger.info('Redis connected successfully');

    // // Test database connection
    // await db.sequelize.authenticate();
    // logger.info('Database connected successfully');

    // // Initialize notification queue processors
    // NotificationService.setupQueueProcessors();
    // logger.info('Notification services initialized');

    // Start server
    const PORT = process.env.port;
    server.listen(PORT, () => {
      logger.info(`🚀 RideShare API Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.nodeEnv}`);
    });

  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp();

module.exports = { app, server, io };
