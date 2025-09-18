const RideService = require('../services/rideService');
const NotificationService = require('../services/notificationService');
const ApiResponse = require('../utils/response');
const { rideBookingSchema, locationUpdateSchema } = require('../utils/validators');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

class RideController {
  /**
   * Book a new ride
   */
  static async bookRide(req, res) {
    try {
      // Validate request data
      const { error, value } = rideBookingSchema.validate(req.body);
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const riderId = req.user.userId;
      const result = await RideService.bookRide(riderId, value);

      ApiResponse.success(res, result, 'Ride booked successfully', 201);
    } catch (error) {
      logger.error('Book ride controller error:', error);
      ApiResponse.error(res, error.message || 'Failed to book ride');
    }
  }

  /**
   * Accept ride by driver
   */
  static async acceptRide(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = req.user.userId;

      if (!rideId) {
        return ApiResponse.error(res, 'Ride ID is required', 400);
      }

      const result = await RideService.acceptRide(driverId, rideId);

      // Notify rider about driver acceptance
      await NotificationService.notifyRideStatusUpdate(
        { rideId, riderId: result.riderId },
        'accepted',
        'rider'
      );

      ApiResponse.success(res, result, 'Ride accepted successfully');
    } catch (error) {
      logger.error('Accept ride controller error:', error);

      if (error.message.includes('not found') || error.message.includes('already accepted')) {
        return ApiResponse.notFound(res, error.message);
      }

      if (error.message.includes('not available')) {
        return ApiResponse.error(res, error.message, 400);
      }

      ApiResponse.error(res, 'Failed to accept ride');
    }
  }

  /**
   * Start ride
   */
  static async startRide(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = req.user.userId;

      if (!rideId) {
        return ApiResponse.error(res, 'Ride ID is required', 400);
      }

      const result = await RideService.startRide(driverId, rideId);

      // Notify rider about ride start
      await NotificationService.notifyRideStatusUpdate(
        { rideId, riderId: result.riderId },
        'started',
        'rider'
      );

      ApiResponse.success(res, result, 'Ride started successfully');
    } catch (error) {
      logger.error('Start ride controller error:', error);

      if (error.message.includes('not found') || error.message.includes('not in correct status')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to start ride');
    }
  }

  /**
   * Complete ride
   */
  static async completeRide(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = req.user.userId;
      const completionData = req.body;

      if (!rideId) {
        return ApiResponse.error(res, 'Ride ID is required', 400);
      }

      const result = await RideService.completeRide(driverId, rideId, completionData);

      // Notify rider about ride completion
      await NotificationService.notifyRideStatusUpdate(
        { rideId, riderId: result.riderId },
        'completed',
        'rider'
      );

      // Send rating requests to both rider and driver
      await NotificationService.notifyRatingRequest(rideId, result.riderId, 'rider');
      await NotificationService.notifyRatingRequest(rideId, driverId, 'driver');

      ApiResponse.success(res, result, 'Ride completed successfully');
    } catch (error) {
      logger.error('Complete ride controller error:', error);

      if (error.message.includes('not found') || error.message.includes('not in correct status')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to complete ride');
    }
  }

  /**
   * Cancel ride
   */
  static async cancelRide(req, res) {
    try {
      const { rideId } = req.params;
      const { cancellationReason } = req.body;
      const userId = req.user.userId;
      const userRole = req.user.role;

      if (!rideId) {
        return ApiResponse.error(res, 'Ride ID is required', 400);
      }

      const cancelledBy = userRole === 'driver' ? 'driver' : 'rider';
      const result = await RideService.cancelRide(userId, rideId, cancellationReason, cancelledBy);

      // Notify the other party about cancellation
      const recipientType = cancelledBy === 'driver' ? 'rider' : 'driver';
      await NotificationService.notifyRideStatusUpdate(
        { rideId, riderId: result.riderId, driverId: result.driverId },
        'cancelled',
        recipientType
      );

      ApiResponse.success(res, result, 'Ride cancelled successfully');
    } catch (error) {
      logger.error('Cancel ride controller error:', error);

      if (error.message.includes('not found') || error.message.includes('cannot be cancelled')) {
        return ApiResponse.notFound(res, error.message);
      }

      if (error.message.includes('Not authorized')) {
        return ApiResponse.forbidden(res, error.message);
      }

      ApiResponse.error(res, 'Failed to cancel ride');
    }
  }

  /**
   * Get ride details
   */
  static async getRideDetails(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.userId;

      if (!rideId) {
        return ApiResponse.error(res, 'Ride ID is required', 400);
      }

      const result = await RideService.getRideDetails(rideId, userId);

      ApiResponse.success(res, result, 'Ride details retrieved successfully');
    } catch (error) {
      logger.error('Get ride details controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      if (error.message.includes('Not authorized')) {
        return ApiResponse.forbidden(res, error.message);
      }

      ApiResponse.error(res, 'Failed to retrieve ride details');
    }
  }

  /**
   * Track ride location
   */
  static async trackRide(req, res) {
    try {
      const { rideId } = req.params;

      // Validate location data
      const { error, value } = locationUpdateSchema.validate(req.body);
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      if (!rideId) {
        return ApiResponse.error(res, 'Ride ID is required', 400);
      }

      const result = await RideService.trackRide(rideId, value);

      ApiResponse.success(res, result, 'Location updated successfully');
    } catch (error) {
      logger.error('Track ride controller error:', error);

      if (error.message.includes('not found') || error.message.includes('not trackable')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to update location');
    }
  }

  /**
   * Get user's ride history
   */
  static async getRideHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, status, startDate, endDate } = req.query;

      // This would need to be implemented in RideService
      // For now, return a placeholder response
      const pagination = paginate(page, limit);

      ApiResponse.success(res, {
        rides: [],
        pagination: {
          ...pagination,
          total: 0,
          totalPages: 0
        }
      }, 'Ride history retrieved successfully');
    } catch (error) {
      logger.error('Get ride history controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve ride history');
    }
  }

  /**
   * Get current ride status
   */
  static async getCurrentRide(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      // This would need to be implemented in RideService
      // Find user's current active ride

      ApiResponse.success(res, null, 'No active ride found');
    } catch (error) {
      logger.error('Get current ride controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve current ride');
    }
  }

  /**
   * Estimate ride fare
   */
  static async estimateFare(req, res) {
    try {
      // Validate request data
      const { error, value } = rideBookingSchema.validate(req.body);
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const { pickupLocation, dropLocation, rideType } = value;

      // Calculate estimated fare (this logic is in RideService.bookRide)
      const { calculateDistance, calculateFare } = require('../utils/helpers');

      const distance = calculateDistance(
        pickupLocation.latitude,
        pickupLocation.longitude,
        dropLocation.latitude,
        dropLocation.longitude
      );

      const duration = Math.round(distance * 3 * 60); // Assuming 20 km/hr average speed
      const fare = calculateFare(distance, duration, rideType);

      const estimate = {
        distance: parseFloat(distance.toFixed(2)),
        estimatedDuration: duration,
        estimatedFare: fare,
        rideType: rideType
      };

      ApiResponse.success(res, estimate, 'Fare estimated successfully');
    } catch (error) {
      logger.error('Estimate fare controller error:', error);
      ApiResponse.error(res, 'Failed to estimate fare');
    }
  }

  /**
   * Get nearby drivers (for debugging/admin)
   */
  static async getNearbyDrivers(req, res) {
    try {
      const { latitude, longitude, radius = 10 } = req.query;

      if (!latitude || !longitude) {
        return ApiResponse.error(res, 'Latitude and longitude are required', 400);
      }

      const location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };

      const DriverService = require('../services/driverService');
      const drivers = await DriverService.getNearbyDrivers(location, parseInt(radius));

      ApiResponse.success(res, drivers, 'Nearby drivers retrieved successfully');
    } catch (error) {
      logger.error('Get nearby drivers controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve nearby drivers');
    }
  }
}

module.exports = RideController;
