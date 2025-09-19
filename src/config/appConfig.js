module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // File upload configuration
  uploadDir: process.env.UPLOAD_DIR || 'src/uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB

  // Rate limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15, // minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // Ride configuration
  rideTypes: {
    ECONOMY: 'economy',
    COMFORT: 'comfort',
    PREMIUM: 'premium'
  },

  rideStatuses: {
    REQUESTED: 'requested',
    ACCEPTED: 'accepted',
    STARTED: 'started',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  userRoles: {
    RIDER: 'rider',
    DRIVER: 'driver',
    ADMIN: 'admin'
  },

  // Fare calculation
  baseFare: 50, // Base fare in rupees
  perKmRate: 12, // Rate per km
  perMinuteRate: 2, // Rate per minute

  // Driver matching
  maxMatchingDistance: 10, // km

  // OTP configuration
  otpExpiryTime: 300000, // 5 minutes in milliseconds

  // Redis Configuration
  REDIS_HOST:"localhost",
  REDIS_PORT:6379,
  REDIS_PASSWORD:""
};