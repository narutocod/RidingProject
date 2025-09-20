const { Op } = require('sequelize');
const { Ride, User, Driver, Vehicle, RideTracking } = require('../models');
const { getRedisClient } = require('../config/redis');
const { calculateDistance, calculateFare, generateRideId } = require('../utils/helpers');
const logger = require('../utils/logger');
const config = require('../config/appConfig');


class RideService {
  /**
   * Book a new ride
   */
  static async bookRide(riderId, rideData) {
    const { pickupLocation, dropLocation, rideType } = rideData;

    try {
      // Calculate estimated distance and fare
      const estimatedDistance = calculateDistance(
        pickupLocation.latitude,
        pickupLocation.longitude,
        dropLocation.latitude,
        dropLocation.longitude
      );

      const estimatedDuration = Math.round(estimatedDistance / 20 * 60); // Distance / speed * 60
      const estimatedFare = calculateFare(estimatedDistance, estimatedDuration, rideType);

      // Create ride
      const ride = await Ride.create({
        rideId: generateRideId(),
        riderId,
        rideType,
        pickupLocation,
        dropLocation,
        estimatedDistance,
        estimatedDuration,
        estimatedFare,
        status: 'requested'
      });

      // Store ride in Redis for quick access
      const redis = getRedisClient();
      await redis.setEx(`ride_${ride.rideId}`, 3600, JSON.stringify({
        id: ride.id,
        rideId: ride.rideId,
        riderId,
        status: 'requested',
        pickupLocation,
        dropLocation,
        rideType,
        estimatedFare
      }));

      logger.info(`Ride booked: ${ride.rideId} by rider: ${riderId}`);

      // Find nearby drivers (async)
      this.findAndNotifyDrivers(ride.id, pickupLocation, rideType);

      return {
        rideId: ride.rideId,
        estimatedDistance,
        estimatedDuration,
        estimatedFare,
        status: 'requested'
      };
    } catch (error) {
      logger.error('Book ride error:', error);
      throw error;
    }
  }

  /**
   * Find and notify nearby drivers
   */
  static async findAndNotifyDrivers(rideId, pickupLocation, rideType) {
    try {
      // Find available drivers within radius
      const availableDrivers = await Driver.findAll({
        where: {
          isOnline: true,
          isAvailable: true,
          isVerified: true
        },
        include: [
          {
            model: User,
            as: 'user',
            where: { isActive: true }
          },
          {
            model: Vehicle,
            as: 'vehicles',
            where: { isActive: true, isVerified: true }
          }
        ]
      });

      // Filter drivers by distance and vehicle type compatibility
      const nearbyDrivers = availableDrivers.filter(driver => {
        if (!driver.currentLocation) return false;

        const distance = calculateDistance(
          pickupLocation.latitude,
          pickupLocation.longitude,
          driver.currentLocation.latitude,
          driver.currentLocation.longitude
        );

        return distance <= config.maxMatchingDistance;
      });

      // Sort by distance
      nearbyDrivers.sort((a, b) => {
        const distanceA = calculateDistance(
          pickupLocation.latitude,
          pickupLocation.longitude,
          a.currentLocation.latitude,
          a.currentLocation.longitude
        );
        const distanceB = calculateDistance(
          pickupLocation.latitude,
          pickupLocation.longitude,
          b.currentLocation.latitude,
          b.currentLocation.longitude
        );
        return distanceA - distanceB;
      });

      // Store potential drivers in Redis
      const redis = getRedisClient();
      if (nearbyDrivers.length > 0) {
        const driverIds = nearbyDrivers.slice(0, 5).map(d => d.id); // Top 5 nearest drivers
        await redis.setEx(`ride_drivers_${rideId}`, 300, JSON.stringify(driverIds)); // 5 minutes expiry
      }

      logger.info(`Found ${nearbyDrivers.length} drivers for ride: ${rideId}`);

      return nearbyDrivers;
    } catch (error) {
      logger.error('Find drivers error:', error);
      return [];
    }
  }

  /**
   * Accept ride by driver
   */
  static async acceptRide(driverId, rideId) {
    try {
      const ride = await Ride.findOne({
        where: { rideId, status: 'requested' },
        include: [
          {
            model: User,
            as: 'rider'
          }
        ]
      });

      if (!ride) {
        throw new Error('Ride not found or already accepted',404);
      }

      // Check if driver is available
      const driver = await Driver.findOne({
        where: { 
          id: driverId, 
          isOnline: true, 
          isAvailable: true,
          isVerified: true 
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'phone', 'email', 'profilePicture']
          },
          {
            model: Vehicle,
            as: 'vehicles',
            where: { isActive: true, isVerified: true }
          }
        ]
      });

      if (!driver) {
        throw new Error('Driver not available',400);
      }

      // Update ride status
      await ride.update({
        driverId: driver.userId,
        vehicleId: driver.vehicles[0].id,
        status: 'accepted'
      });

      // Update driver availability
      await driver.update({ isAvailable: false });

      // Update Redis cache
      const redis = getRedisClient();
      const rideCache = await redis.get(`ride_${rideId}`);
      if (rideCache) {
        const rideData = JSON.parse(rideCache);
        rideData.status = 'accepted';
        rideData.driverId = driver.userId;
        rideData.vehicleId = driver.vehicles[0].id;
        await redis.setEx(`ride_${rideId}`, 3600, JSON.stringify(rideData));
      }

      logger.info(`Ride accepted: ${rideId} by driver: ${driverId}`);

      return {
        rideId: ride.rideId,
        status: 'accepted',
        driver: {
          id: driver.id,
          name: driver.user.name,
          phone: driver.user.phone,
          rating: driver.averageRating,
          currentLocation: driver.currentLocation
        },
        vehicle: {
          type: driver.vehicles[0].vehicleType,
          number: driver.vehicles[0].vehicleNumber,
          brand: driver.vehicles[0].vehicleBrand,
          model: driver.vehicles[0].vehicleModel,
          color: driver.vehicles[0].vehicleColor
        }
      };
    } catch (error) {
      logger.error('Accept ride error:', error);
      throw error;
    }
  }

  /**
   * Start ride
   */
  static async startRide(driverId, rideId) {
    try {
      const ride = await Ride.findOne({
        where: { rideId, status: 'accepted' }
      });
      if (!ride) {
        throw new Error('Ride not found or not in correct status');
      }

      // Update ride status
      await ride.update({
        status: 'started',
        rideStartedAt: new Date()
      });

      // Update Redis cache
      const redis = getRedisClient();
      const rideCache = await redis.get(`ride_${rideId}`);
      if (rideCache) {
        const rideData = JSON.parse(rideCache);
        rideData.status = 'started';
        await redis.setEx(`ride_${rideId}`, 3600, JSON.stringify(rideData));
      }

      logger.info(`Ride started: ${rideId}`);

      return {
        rideId: ride.rideId,
        status: 'started',
        startedAt: ride.rideStartedAt
      };
    } catch (error) {
      logger.error('Start ride error:', error);
      throw error;
    }
  }

  /**
   * Complete ride
   */
  static async completeRide(driverId, rideId, completionData = {}) {
    const { actualDistance, odometerReading } = completionData;

    try {
      const ride = await Ride.findOne({
        where: { rideId, status: 'started' }
      });

      if (!ride) {
        throw new Error('Ride not found or not in correct status');
      }

      // Calculate actual duration
      const actualDuration = Math.round((new Date() - ride.rideStartedAt) / 1000);

      // Use provided distance or estimate from tracking data
      let finalDistance = actualDistance || ride.estimatedDistance;

      if (!actualDistance) {
        // Calculate from tracking data if available
        const trackingData = await RideTracking.findAll({
          where: { rideId: ride.id },
          order: [['timestamp', 'ASC']]
        });

        if (trackingData.length > 1) {
          let totalDistance = 0;
          for (let i = 1; i < trackingData.length; i++) {
            totalDistance += calculateDistance(
              trackingData[i-1].latitude,
              trackingData[i-1].longitude,
              trackingData[i].latitude,
              trackingData[i].longitude
            );
          }
          finalDistance = totalDistance;
        }
      }

      // Calculate final fare
      const actualFare = calculateFare(finalDistance, actualDuration, ride.rideType);

      // Update ride
      await ride.update({
        status: 'completed',
        actualDistance: finalDistance,
        actualDuration,
        actualFare,
        rideCompletedAt: new Date()
      });

      // Update driver availability
      const driver = await Driver.findOne({ where: { userId: driverId } });
      await driver.update({
        isAvailable: true,
        totalRides: driver.totalRides + 1,
        totalEarnings: parseFloat(driver.totalEarnings) + parseFloat(actualFare)
      });

      // Update rider stats
      const rider = await User.findByPk(ride.riderId);
      // Add logic to update rider stats if needed

      // Clean up Redis cache
      const redis = getRedisClient();
      await redis.del(`ride_${rideId}`);

      logger.info(`Ride completed: ${rideId}`);

      return {
        rideId: ride.rideId,
        status: 'completed',
        actualDistance: finalDistance,
        actualDuration,
        actualFare,
        completedAt: ride.rideCompletedAt
      };
    } catch (error) {
      logger.error('Complete ride error:', error);
      throw error;
    }
  }

  /**
   * Cancel ride
   */
  static async cancelRide(userId, rideId, cancellationReason, cancelledBy) {
    try {
      const ride = await Ride.findOne({
        where: { 
          rideId,
          status: { [Op.in]: ['requested', 'accepted'] }
        }
      });

      if (!ride) {
        throw new Error('Ride not found or cannot be cancelled');
      }

      // Check authorization
      if (ride.riderId !== userId && ride.driverId !== userId) {
        throw new Error('Not authorized to cancel this ride');
      }

      // Update ride status
      await ride.update({
        status: 'cancelled',
        cancellationReason,
        cancelledBy
      });

      // If driver was assigned, make them available again
      if (ride.driverId) {
        const driver = await Driver.findOne({ where: { userId: ride.driverId } });
        if (driver) {
          await driver.update({ isAvailable: true });
        }
      }

      // Clean up Redis cache
      const redis = getRedisClient();
      await redis.del(`ride_${rideId}`);

      logger.info(`Ride cancelled: ${rideId} by ${cancelledBy}`);

      return {
        rideId: ride.rideId,
        status: 'cancelled',
        cancellationReason
      };
    } catch (error) {
      logger.error('Cancel ride error:', error);
      throw error;
    }
  }

  /**
   * Get ride details
   */
  static async getRideDetails(rideId, userId) {
    try {
      const ride = await Ride.findOne({
        where: { id:rideId },
        include: [
          {
            model: User,
            as: 'rider',
            attributes: ['id', 'name', 'phone', 'profilePicture']
          },
          {
            model: User,
            as: 'driver',
            attributes: ['id', 'name', 'phone', 'profilePicture']
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['vehicleType', 'vehicleNumber', 'vehicleBrand', 'vehicleModel', 'vehicleColor']
          }
        ]
      });

      if (!ride) {
        throw new Error('Ride not found');
      }

      // Check authorization
      if (ride.riderId !== userId && ride.driverId !== userId) {
        throw new Error('Not authorized to view this ride');
      }

      return ride;
    } catch (error) {
      logger.error('Get ride details error:', error);
      throw error;
    }
  }

  /**
   * Track ride location
   */
  static async trackRide(rideId, locationData) {
    const { latitude, longitude, accuracy, heading, speed } = locationData;

    try {
      const ride = await Ride.findOne({
        where: { rideId, status: { [Op.in]: ['accepted', 'started'] } }
      });

      if (!ride) {
        throw new Error('Ride not found or not trackable');
      }

      // Save tracking data
      await RideTracking.create({
        rideId: ride.id,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        timestamp: new Date()
      });

      // Update Redis with latest location
      const redis = getRedisClient();
      await redis.setEx(`ride_location_${rideId}`, 300, JSON.stringify({
        latitude,
        longitude,
        heading,
        speed,
        timestamp: new Date().toISOString()
      }));

      return { success: true };
    } catch (error) {
      logger.error('Track ride error:', error);
      throw error;
    }
  }
}

module.exports = RideService;
