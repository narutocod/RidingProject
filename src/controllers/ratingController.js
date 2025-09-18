const RatingService = require('../services/ratingService');
const ApiResponse = require('../utils/response');
const { ratingSchema } = require('../utils/validators');
const logger = require('../utils/logger');

class RatingController {
  /**
   * Submit rating for a ride
   */
  static async submitRating(req, res) {
    try {
      // Validate request data
      const { error, value } = ratingSchema.validate(req.body);
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const raterId = req.user.userId;
      const userRole = req.user.role;

      // Determine rating type based on user role
      const ratingType = userRole === 'rider' ? 'rider_to_driver' : 'driver_to_rider';

      const ratingData = {
        ...value,
        raterId,
        ratingType
      };

      const result = await RatingService.submitRating(ratingData);

      ApiResponse.success(res, result, 'Rating submitted successfully', 201);
    } catch (error) {
      logger.error('Submit rating controller error:', error);

      if (error.message.includes('not found') || error.message.includes('not completed')) {
        return ApiResponse.notFound(res, error.message);
      }

      if (error.message.includes('Not authorized')) {
        return ApiResponse.forbidden(res, error.message);
      }

      if (error.message.includes('already submitted')) {
        return ApiResponse.error(res, error.message, 400);
      }

      ApiResponse.error(res, 'Failed to submit rating');
    }
  }

  /**
   * Get ratings for a user
   */
  static async getUserRatings(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const userRole = req.user.role;

      // Determine rating type based on user role
      const ratingType = userRole === 'rider' ? 'driver_to_rider' : 'rider_to_driver';

      const result = await RatingService.getUserRatings(
        parseInt(userId), 
        ratingType, 
        parseInt(page), 
        parseInt(limit)
      );

      ApiResponse.paginated(res, result.ratings, result.pagination, 'Ratings retrieved successfully');
    } catch (error) {
      logger.error('Get user ratings controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve ratings');
    }
  }

  /**
   * Get rating statistics for current user
   */
  static async getMyRatingStatistics(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Determine rating type based on user role
      const ratingType = userRole === 'rider' ? 'driver_to_rider' : 'rider_to_driver';

      const result = await RatingService.getRatingStatistics(userId, ratingType);

      ApiResponse.success(res, result, 'Rating statistics retrieved successfully');
    } catch (error) {
      logger.error('Get rating statistics controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve rating statistics');
    }
  }

  /**
   * Get rating statistics for a user
   */
  static async getUserRatingStatistics(req, res) {
    try {
      const { userId } = req.params;
      const { ratingType } = req.query;

      if (!ratingType || !['rider_to_driver', 'driver_to_rider'].includes(ratingType)) {
        return ApiResponse.error(res, 'Valid rating type is required', 400);
      }

      const result = await RatingService.getRatingStatistics(parseInt(userId), ratingType);

      ApiResponse.success(res, result, 'Rating statistics retrieved successfully');
    } catch (error) {
      logger.error('Get user rating statistics controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve rating statistics');
    }
  }

  /**
   * Get ride ratings
   */
  static async getRideRatings(req, res) {
    try {
      const { rideId } = req.params;

      if (!rideId) {
        return ApiResponse.error(res, 'Ride ID is required', 400);
      }

      const result = await RatingService.getRideRatings(parseInt(rideId));

      ApiResponse.success(res, result, 'Ride ratings retrieved successfully');
    } catch (error) {
      logger.error('Get ride ratings controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve ride ratings');
    }
  }

  /**
   * Get top rated drivers
   */
  static async getTopRatedDrivers(req, res) {
    try {
      const { limit = 10 } = req.query;

      const result = await RatingService.getTopRatedDrivers(parseInt(limit));

      ApiResponse.success(res, result, 'Top rated drivers retrieved successfully');
    } catch (error) {
      logger.error('Get top rated drivers controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve top rated drivers');
    }
  }

  /**
   * Get recent reviews for current user
   */
  static async getMyRecentReviews(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { limit = 10 } = req.query;

      // Determine rating type based on user role
      const ratingType = userRole === 'rider' ? 'driver_to_rider' : 'rider_to_driver';

      const result = await RatingService.getRecentReviews(userId, ratingType, parseInt(limit));

      ApiResponse.success(res, result, 'Recent reviews retrieved successfully');
    } catch (error) {
      logger.error('Get recent reviews controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve recent reviews');
    }
  }

  /**
   * Check if user can rate a ride
   */
  static async canRateRide(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      if (!rideId) {
        return ApiResponse.error(res, 'Ride ID is required', 400);
      }

      // Determine rating type based on user role
      const ratingType = userRole === 'rider' ? 'rider_to_driver' : 'driver_to_rider';

      const result = await RatingService.canRateRide(parseInt(rideId), userId, ratingType);

      ApiResponse.success(res, result, 'Rating eligibility checked successfully');
    } catch (error) {
      logger.error('Can rate ride controller error:', error);
      ApiResponse.error(res, 'Failed to check rating eligibility');
    }
  }
}

module.exports = RatingController;
