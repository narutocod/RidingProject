const DriverService = require('../services/driverService');
const ApiResponse = require('../utils/response');
const { vehicleDetailsSchema, locationUpdateSchema } = require('../utils/validators');
const logger = require('../utils/logger');

class DriverController {
  /**
   * Update driver profile
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profileData = req.body;

      // Handle file uploads
      if (req.files) {
        if (req.files.driverLicense) {
          profileData.driverLicensePath = req.files.driverLicense[0].path;
        }
        if (req.files.vehicleRegistration) {
          profileData.vehicleRegistrationPath = req.files.vehicleRegistration[0].path;
        }
        if (req.files.vehicleInsurance) {
          profileData.vehicleInsurancePath = req.files.vehicleInsurance[0].path;
        }
      }

      const result = await DriverService.updateProfile(userId, profileData);

      ApiResponse.success(res, result, 'Driver profile updated successfully');
    } catch (error) {
      logger.error('Update driver profile controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to update driver profile');
    }
  }

  /**
   * Get driver profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const result = await DriverService.getDriverProfile(userId);

      ApiResponse.success(res, result, 'Driver profile retrieved successfully');
    } catch (error) {
      logger.error('Get driver profile controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to retrieve driver profile');
    }
  }

  /**
   * Update driver location
   */
  static async updateLocation(req, res) {
    try {
      // Validate location data
      const { error, value } = locationUpdateSchema.validate(req.body);
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const userId = req.user.userId;
      const result = await DriverService.updateLocation(userId, value);

      ApiResponse.success(res, result, 'Location updated successfully');
    } catch (error) {
      logger.error('Update driver location controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to update location');
    }
  }

  /**
   * Toggle driver online status
   */
  static async toggleOnlineStatus(req, res) {
    try {
      const userId = req.user.userId;
      const result = await DriverService.toggleOnlineStatus(userId);

      const message = result.isOnline ? 'Driver is now online' : 'Driver is now offline';
      ApiResponse.success(res, result, message);
    } catch (error) {
      logger.error('Toggle online status controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to toggle online status');
    }
  }

  /**
   * Toggle driver availability
   */
  static async toggleAvailability(req, res) {
    try {
      const userId = req.user.userId;
      const result = await DriverService.toggleAvailability(userId);

      const message = result.isAvailable ? 'Driver is now available' : 'Driver is now unavailable';
      ApiResponse.success(res, result, message);
    } catch (error) {
      logger.error('Toggle availability controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      if (error.message.includes('must be online')) {
        return ApiResponse.error(res, error.message, 400);
      }

      ApiResponse.error(res, 'Failed to toggle availability');
    }
  }

  /**
   * Get driver earnings
   */
  static async getEarnings(req, res) {
    try {
      const userId = req.user.userId;
      const { timeFrame = 'week' } = req.query;

      const validTimeFrames = ['today', 'week', 'month'];
      if (!validTimeFrames.includes(timeFrame)) {
        return ApiResponse.error(res, 'Invalid time frame. Use: today, week, or month', 400);
      }

      const result = await DriverService.getEarnings(userId, timeFrame);

      ApiResponse.success(res, result, 'Earnings retrieved successfully');
    } catch (error) {
      logger.error('Get driver earnings controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to retrieve earnings');
    }
  }

  /**
   * Get driver statistics
   */
  static async getStatistics(req, res) {
    try {
      const userId = req.user.userId;
      const result = await DriverService.getStatistics(userId);

      ApiResponse.success(res, result, 'Statistics retrieved successfully');
    } catch (error) {
      logger.error('Get driver statistics controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to retrieve statistics');
    }
  }

  /**
   * Update vehicle details
   */
  static async updateVehicle(req, res) {
    try {
      // Validate vehicle data
      const { error, value } = vehicleDetailsSchema.validate(req.body);
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const userId = req.user.userId;

      // Handle file uploads for vehicle documents
      if (req.files) {
        if (req.files.vehicleRegistration) {
          value.registrationPath = req.files.vehicleRegistration[0].path;
        }
        if (req.files.vehicleInsurance) {
          value.insurancePath = req.files.vehicleInsurance[0].path;
        }
      }

      const result = await DriverService.updateProfile(userId, { vehicleDetails: value });

      ApiResponse.success(res, result, 'Vehicle details updated successfully');
    } catch (error) {
      logger.error('Update vehicle controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to update vehicle details');
    }
  }

  /**
   * Get driver dashboard data
   */
  static async getDashboard(req, res) {
    try {
      const userId = req.user.userId;

      // Get multiple data points for dashboard
      const [profile, statistics, todayEarnings] = await Promise.all([
        DriverService.getDriverProfile(userId),
        DriverService.getStatistics(userId),
        DriverService.getEarnings(userId, 'today')
      ]);

      const dashboardData = {
        profile: {
          name: profile.user.name,
          phone: profile.user.phone,
          isOnline: profile.isOnline,
          isAvailable: profile.isAvailable,
          isVerified: profile.isVerified,
          averageRating: profile.averageRating
        },
        today: {
          rides: todayEarnings.totalRides,
          earnings: todayEarnings.totalEarnings,
          distance: todayEarnings.totalDistance,
          duration: todayEarnings.totalDuration
        },
        overall: {
          totalRides: statistics.statistics.totalRides,
          totalEarnings: statistics.statistics.totalEarnings,
          averageRating: statistics.statistics.averageRating
        },
        vehicle: profile.vehicles?.[0] || null
      };

      ApiResponse.success(res, dashboardData, 'Dashboard data retrieved successfully');
    } catch (error) {
      logger.error('Get driver dashboard controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve dashboard data');
    }
  }

  /**
   * Get driver's current status
   */
  static async getCurrentStatus(req, res) {
    try {
      const userId = req.user.userId;
      const profile = await DriverService.getDriverProfile(userId);

      const status = {
        isOnline: profile.isOnline,
        isAvailable: profile.isAvailable,
        currentLocation: profile.currentLocation,
        isVerified: profile.isVerified,
        documentsVerified: profile.documentsVerified
      };

      ApiResponse.success(res, status, 'Current status retrieved successfully');
    } catch (error) {
      logger.error('Get current status controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      ApiResponse.error(res, 'Failed to retrieve current status');
    }
  }

  /**
   * Upload driver documents
   */
  static async uploadDocuments(req, res) {
    try {
      const userId = req.user.userId;

      if (!req.files || Object.keys(req.files).length === 0) {
        return ApiResponse.error(res, 'No files uploaded', 400);
      }

      const documentPaths = {};

      // Process uploaded files
      if (req.files.driverLicense) {
        documentPaths.driverLicensePath = req.files.driverLicense[0].path;
      }
      if (req.files.vehicleRegistration) {
        documentPaths.vehicleRegistrationPath = req.files.vehicleRegistration[0].path;
      }
      if (req.files.vehicleInsurance) {
        documentPaths.vehicleInsurancePath = req.files.vehicleInsurance[0].path;
      }

      const result = await DriverService.updateProfile(userId, documentPaths);

      ApiResponse.success(res, result, 'Documents uploaded successfully');
    } catch (error) {
      logger.error('Upload documents controller error:', error);
      ApiResponse.error(res, 'Failed to upload documents');
    }
  }
}

module.exports = DriverController;
