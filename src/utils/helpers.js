const crypto = require('crypto');
const moment = require('moment');
const config = require('../config/appConfig');


/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Generate random OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

/**
 * Generate unique ride ID
 */
const generateRideId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `RIDE_${timestamp}_${randomStr}`.toUpperCase();
};

/**
 * Calculate fare based on distance and time
 */
const calculateFare = (distance, duration, rideType = 'economy') => {

  const multipliers = {
    economy: 1,
    comfort: 1.2,
    premium: 1.5
  };

  const multiplier = multipliers[rideType] || 1;
  const baseFare = config.baseFare * multiplier;
  const distanceFare = distance * config.perKmRate * multiplier;
  const timeFare = (duration / 60) * config.perMinuteRate * multiplier; // duration in seconds

  return Math.round(baseFare + distanceFare + timeFare);
};

/**
 * Format phone number to standard format
 */
const formatPhoneNumber = (phone) => {
  // Remove any non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Add country code if not present
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }

  return phone;
};

/**
 * Generate random location within radius (for testing)
 */
const generateRandomLocation = (centerLat, centerLng, radiusKm = 5) => {
  const radiusInDegrees = radiusKm / 111;

  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  return {
    latitude: centerLat + x,
    longitude: centerLng + y
  };
};

/**
 * Check if a point is within a radius
 */
const isWithinRadius = (centerLat, centerLng, pointLat, pointLng, radiusKm) => {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radiusKm;
};

/**
 * Get time ago string
 */
const getTimeAgo = (date) => {
  return moment(date).fromNow();
};

/**
 * Paginate results
 */
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return {
    limit: parseInt(limit),
    offset: parseInt(offset)
  };
};

module.exports = {
  calculateDistance,
  generateOTP,
  generateRideId,
  calculateFare,
  formatPhoneNumber,
  generateRandomLocation,
  isWithinRadius,
  getTimeAgo,
  paginate
};
