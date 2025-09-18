const Joi = require('joi');

// Phone number validation (Indian format)
const phoneSchema = Joi.string()
  .pattern(/^[6-9]\d{9}$/)
  .required()
  .messages({
    'string.pattern.base': 'Phone number must be a valid 10-digit Indian number'
  });

// User registration validation
const userRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  phone: phoneSchema,
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('rider', 'driver').required()
});

// User login validation
const userLoginSchema = Joi.object({
  phone: phoneSchema,
  password: Joi.string().required()
});

// OTP validation
const otpVerificationSchema = Joi.object({
  phone: phoneSchema,
  otp: Joi.string().length(6).required()
});

// Ride booking validation
const rideBookingSchema = Joi.object({
  pickupLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().required()
  }).required(),
  dropLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    address: Joi.string().required()
  }).required(),
  rideType: Joi.string().valid('economy', 'comfort', 'premium').required()
});

// Driver vehicle details validation
const vehicleDetailsSchema = Joi.object({
  vehicleType: Joi.string().valid('car', 'bike', 'auto').required(),
  vehicleNumber: Joi.string().required(),
  vehicleBrand: Joi.string().required(),
  vehicleModel: Joi.string().required(),
  vehicleColor: Joi.string().required()
});

// Location update validation
const locationUpdateSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});

// Rating validation
const ratingSchema = Joi.object({
  rideId: Joi.number().integer().positive().required(),
  rating: Joi.number().min(1).max(5).required(),
  feedback: Joi.string().max(500).optional()
});

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  otpVerificationSchema,
  rideBookingSchema,
  vehicleDetailsSchema,
  locationUpdateSchema,
  ratingSchema
};
