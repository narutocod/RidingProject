const { Op } = require('sequelize');
const { Rating, Ride, User, Driver, Rider } = require('../models');
const logger = require('../utils/logger');

class RatingService {
  /**
   * Submit rating for a ride
   */
  static async submitRating(ratingData) {
    const { rideId, raterId, rating, feedback, ratingType } = ratingData;

    try {
      // Find the ride
      const ride = await Ride.findOne({
        where: { id: rideId, status: 'completed' }
      });

      if (!ride) {
        throw new Error('Ride not found or not completed');
      }

      // Verify authorization
      if (ratingType === 'rider_to_driver' && ride.riderId !== raterId) {
        throw new Error('Not authorized to rate this ride');
      }

      if (ratingType === 'driver_to_rider' && ride.driverId !== raterId) {
        throw new Error('Not authorized to rate this ride');
      }

      // Check if rating already exists
      const existingRating = await Rating.findOne({
        where: {
          rideId: rideId,
          raterId: raterId,
          ratingType: ratingType
        }
      });

      if (existingRating) {
        throw new Error('Rating already submitted for this ride');
      }

      // Determine who is being rated
      const ratedUserId = ratingType === 'rider_to_driver' ? ride.driverId : ride.riderId;

      // Create rating
      const newRating = await Rating.create({
        rideId: rideId,
        raterId: raterId,
        ratedUserId: ratedUserId,
        rating: rating,
        feedback: feedback,
        ratingType: ratingType
      });

      // Update average rating for the rated user
      await this.updateAverageRating(ratedUserId, ratingType);

      logger.info(`Rating submitted: ${newRating.id} by user: ${raterId}`);

      return {
        id: newRating.id,
        rating: newRating.rating,
        feedback: newRating.feedback,
        ratingType: newRating.ratingType,
        createdAt: newRating.createdAt
      };
    } catch (error) {
      logger.error('Submit rating error:', error);
      throw error;
    }
  }

  /**
   * Update average rating for user
   */
  static async updateAverageRating(userId, ratingType) {
    try {
      // Calculate new average rating
      const ratings = await Rating.findAll({
        where: {
          ratedUserId: userId,
          ratingType: ratingType
        }
      });

      if (ratings.length === 0) return;

      const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = (totalRating / ratings.length).toFixed(2);

      // Update user's average rating based on their role
      if (ratingType === 'rider_to_driver') {
        // Update driver's rating
        const driver = await Driver.findOne({ where: { userId: userId } });
        if (driver) {
          await driver.update({ averageRating: parseFloat(averageRating) });
        }
      } else if (ratingType === 'driver_to_rider') {
        // Update rider's rating
        const rider = await Rider.findOne({ where: { userId: userId } });
        if (rider) {
          await rider.update({ averageRating: parseFloat(averageRating) });
        }
      }

      logger.info(`Average rating updated for user: ${userId} - New rating: ${averageRating}`);
    } catch (error) {
      logger.error('Update average rating error:', error);
    }
  }

  /**
   * Get ratings for a user
   */
  static async getUserRatings(userId, ratingType, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const ratings = await Rating.findAndCountAll({
        where: {
          ratedUserId: userId,
          ratingType: ratingType
        },
        include: [
          {
            model: User,
            as: 'rater',
            attributes: ['id', 'name', 'profilePicture']
          },
          {
            model: Ride,
            as: 'ride',
            attributes: ['rideId', 'pickupLocation', 'dropLocation', 'rideCompletedAt']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        ratings: ratings.rows,
        pagination: {
          page,
          limit,
          total: ratings.count,
          totalPages: Math.ceil(ratings.count / limit)
        }
      };
    } catch (error) {
      logger.error('Get user ratings error:', error);
      throw error;
    }
  }

  /**
   * Get rating statistics for a user
   */
  static async getRatingStatistics(userId, ratingType) {
    try {
      const ratings = await Rating.findAll({
        where: {
          ratedUserId: userId,
          ratingType: ratingType
        },
        attributes: ['rating']
      });

      if (ratings.length === 0) {
        return {
          totalRatings: 0,
          averageRating: 0,
          ratingDistribution: {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
          }
        };
      }

      const totalRatings = ratings.length;
      const totalScore = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = (totalScore / totalRatings).toFixed(2);

      // Calculate rating distribution
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      ratings.forEach(r => {
        ratingDistribution[r.rating]++;
      });

      return {
        totalRatings,
        averageRating: parseFloat(averageRating),
        ratingDistribution
      };
    } catch (error) {
      logger.error('Get rating statistics error:', error);
      throw error;
    }
  }

  /**
   * Get ride ratings (both rider and driver ratings for a ride)
   */
  static async getRideRatings(rideId) {
    try {
      const ratings = await Rating.findAll({
        where: { rideId: rideId },
        include: [
          {
            model: User,
            as: 'rater',
            attributes: ['id', 'name', 'profilePicture']
          },
          {
            model: User,
            as: 'ratedUser',
            attributes: ['id', 'name', 'profilePicture']
          }
        ]
      });

      const rideRatings = {
        riderToDriver: null,
        driverToRider: null
      };

      ratings.forEach(rating => {
        if (rating.ratingType === 'rider_to_driver') {
          rideRatings.riderToDriver = rating;
        } else if (rating.ratingType === 'driver_to_rider') {
          rideRatings.driverToRider = rating;
        }
      });

      return rideRatings;
    } catch (error) {
      logger.error('Get ride ratings error:', error);
      throw error;
    }
  }

  /**
   * Get top rated drivers
   */
  static async getTopRatedDrivers(limit = 10) {
    try {
      const drivers = await Driver.findAll({
        where: {
          isVerified: true,
          totalRides: { [Op.gte]: 5 } // At least 5 rides
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'profilePicture']
          }
        ],
        order: [['averageRating', 'DESC'], ['totalRides', 'DESC']],
        limit
      });

      return drivers.map(driver => ({
        id: driver.id,
        userId: driver.userId,
        name: driver.user.name,
        profilePicture: driver.user.profilePicture,
        averageRating: driver.averageRating,
        totalRides: driver.totalRides,
        totalEarnings: driver.totalEarnings
      }));
    } catch (error) {
      logger.error('Get top rated drivers error:', error);
      throw error;
    }
  }

  /**
   * Get recent reviews with feedback
   */
  static async getRecentReviews(userId, ratingType, limit = 10) {
    try {
      const reviews = await Rating.findAll({
        where: {
          ratedUserId: userId,
          ratingType: ratingType,
          feedback: { [Op.ne]: null }
        },
        include: [
          {
            model: User,
            as: 'rater',
            attributes: ['name', 'profilePicture']
          },
          {
            model: Ride,
            as: 'ride',
            attributes: ['rideId', 'rideCompletedAt']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit
      });

      return reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        feedback: review.feedback,
        raterName: review.rater.name,
        raterProfilePicture: review.rater.profilePicture,
        rideId: review.ride.rideId,
        rideCompletedAt: review.ride.rideCompletedAt,
        createdAt: review.createdAt
      }));
    } catch (error) {
      logger.error('Get recent reviews error:', error);
      throw error;
    }
  }

  /**
   * Check if user can rate a ride
   */
  static async canRateRide(rideId, userId, ratingType) {
    try {
      const ride = await Ride.findByPk(rideId);

      if (!ride || ride.status !== 'completed') {
        return { canRate: false, reason: 'Ride not completed' };
      }

      // Check authorization
      if (ratingType === 'rider_to_driver' && ride.riderId !== userId) {
        return { canRate: false, reason: 'Not authorized' };
      }

      if (ratingType === 'driver_to_rider' && ride.driverId !== userId) {
        return { canRate: false, reason: 'Not authorized' };
      }

      // Check if already rated
      const existingRating = await Rating.findOne({
        where: {
          rideId: rideId,
          raterId: userId,
          ratingType: ratingType
        }
      });

      if (existingRating) {
        return { canRate: false, reason: 'Already rated' };
      }

      return { canRate: true };
    } catch (error) {
      logger.error('Check can rate ride error:', error);
      return { canRate: false, reason: 'Error checking rating eligibility' };
    }
  }
}

module.exports = RatingService;
