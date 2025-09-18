const { Op } = require('sequelize');
const { Driver, User, Vehicle, DriverLocation, Ride } = require('../../models');
const { getRedisClient } = require('../config/redis');
const { calculateDistance } = require('../utils/helpers');
const logger = require('../utils/logger');

class DriverService {
  /**
   * Update driver profile
   */
  static async updateProfile(userId, profileData) {
    const {
      licenseNumber,
      licenseExpiry,
      vehicleDetails,
      driverLicensePath,
      emergencyContact
    } = profileData;

    try {
      const driver = await Driver.findOne({
        where: { userId },
        include: [{ model: User, as: 'user' }]
      });

      if (!driver) {
        throw new Error('Driver profile not found');
      }

      // Update driver details
      const updateData = {};
      if (licenseNumber) updateData.licenseNumber = licenseNumber;
      if (licenseExpiry) updateData.licenseExpiry = licenseExpiry;
      if (driverLicensePath) updateData.driverLicensePath = driverLicensePath;

      await driver.update(updateData);

      // Update vehicle details if provided
      if (vehicleDetails) {
        let vehicle = await Vehicle.findOne({ where: { driverId: driver.id } });

        if (vehicle) {
          await vehicle.update(vehicleDetails);
        } else {
          await Vehicle.create({
            ...vehicleDetails,
            driverId: driver.id
          });
        }
      }

      logger.info(`Driver profile updated: ${userId}`);

      return await this.getDriverProfile(userId);
    } catch (error) {
      logger.error('Update driver profile error:', error);
      throw error;
    }
  }

  /**
   * Get driver profile
   */
  static async getDriverProfile(userId) {
    try {
      const driver = await Driver.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'phone', 'email', 'profilePicture']
          },
          {
            model: Vehicle,
            as: 'vehicles'
          }
        ]
      });

      if (!driver) {
        throw new Error('Driver profile not found');
      }

      return driver;
    } catch (error) {
      logger.error('Get driver profile error:', error);
      throw error;
    }
  }

  /**
   * Update driver location
   */
  static async updateLocation(userId, locationData) {
    const { latitude, longitude, accuracy, heading, speed, address } = locationData;

    try {
      const driver = await Driver.findOne({ where: { userId } });
      if (!driver) {
        throw new Error('Driver not found');
      }

      // Update current location in driver table
      await driver.update({
        currentLocation: {
          latitude,
          longitude,
          accuracy,
          heading,
          speed,
          timestamp: new Date().toISOString()
        }
      });

      // Store location history
      await DriverLocation.create({
        driverId: driver.id,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        address
      });

      // Update Redis cache for quick access
      const redis = getRedisClient();
      await redis.setEx(`driver_location_${driver.id}`, 300, JSON.stringify({
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        timestamp: new Date().toISOString()
      }));

      logger.info(`Driver location updated: ${userId}`);

      return { success: true };
    } catch (error) {
      logger.error('Update driver location error:', error);
      throw error;
    }
  }

  /**
   * Toggle driver online status
   */
  static async toggleOnlineStatus(userId) {
    try {
      const driver = await Driver.findOne({ where: { userId } });
      if (!driver) {
        throw new Error('Driver not found');
      }

      const newStatus = !driver.isOnline;

      await driver.update({
        isOnline: newStatus,
        isAvailable: newStatus // If going offline, also set unavailable
      });

      // If going offline, remove from active drivers cache
      if (!newStatus) {
        const redis = getRedisClient();
        await redis.del(`driver_location_${driver.id}`);
      }

      logger.info(`Driver ${newStatus ? 'online' : 'offline'}: ${userId}`);

      return {
        isOnline: newStatus,
        isAvailable: driver.isAvailable
      };
    } catch (error) {
      logger.error('Toggle online status error:', error);
      throw error;
    }
  }

  /**
   * Toggle driver availability
   */
  static async toggleAvailability(userId) {
    try {
      const driver = await Driver.findOne({ where: { userId } });
      if (!driver) {
        throw new Error('Driver not found');
      }

      if (!driver.isOnline) {
        throw new Error('Driver must be online to change availability');
      }

      const newAvailability = !driver.isAvailable;
      await driver.update({ isAvailable: newAvailability });

      logger.info(`Driver availability ${newAvailability ? 'enabled' : 'disabled'}: ${userId}`);

      return {
        isOnline: driver.isOnline,
        isAvailable: newAvailability
      };
    } catch (error) {
      logger.error('Toggle availability error:', error);
      throw error;
    }
  }

  /**
   * Get driver earnings
   */
  static async getEarnings(userId, timeFrame = 'week') {
    try {
      const driver = await Driver.findOne({ where: { userId } });
      if (!driver) {
        throw new Error('Driver not found');
      }

      let startDate = new Date();

      switch (timeFrame) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const rides = await Ride.findAll({
        where: {
          driverId: userId,
          status: 'completed',
          rideCompletedAt: {
            [Op.gte]: startDate
          }
        },
        attributes: ['actualFare', 'rideCompletedAt', 'actualDistance', 'actualDuration']
      });

      const totalEarnings = rides.reduce((sum, ride) => sum + parseFloat(ride.actualFare), 0);
      const totalRides = rides.length;
      const totalDistance = rides.reduce((sum, ride) => sum + parseFloat(ride.actualDistance), 0);
      const totalDuration = rides.reduce((sum, ride) => sum + parseInt(ride.actualDuration), 0);

      return {
        timeFrame,
        totalEarnings,
        totalRides,
        totalDistance,
        totalDuration,
        averageEarningsPerRide: totalRides > 0 ? totalEarnings / totalRides : 0,
        rides
      };
    } catch (error) {
      logger.error('Get driver earnings error:', error);
      throw error;
    }
  }

  /**
   * Get driver statistics
   */
  static async getStatistics(userId) {
    try {
      const driver = await Driver.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name', 'phone', 'createdAt']
          }
        ]
      });

      if (!driver) {
        throw new Error('Driver not found');
      }

      // Get completed rides count for different periods
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [todayRides, weekRides, monthRides, totalRides] = await Promise.all([
        Ride.count({
          where: {
            driverId: userId,
            status: 'completed',
            rideCompletedAt: { [Op.gte]: startOfToday }
          }
        }),
        Ride.count({
          where: {
            driverId: userId,
            status: 'completed',
            rideCompletedAt: { [Op.gte]: startOfWeek }
          }
        }),
        Ride.count({
          where: {
            driverId: userId,
            status: 'completed',
            rideCompletedAt: { [Op.gte]: startOfMonth }
          }
        }),
        Ride.count({
          where: {
            driverId: userId,
            status: 'completed'
          }
        })
      ]);

      return {
        driver: {
          id: driver.id,
          name: driver.user.name,
          phone: driver.user.phone,
          joinedAt: driver.user.createdAt,
          isVerified: driver.isVerified,
          isOnline: driver.isOnline,
          isAvailable: driver.isAvailable,
          averageRating: driver.averageRating,
          totalEarnings: driver.totalEarnings
        },
        statistics: {
          todayRides,
          weekRides,
          monthRides,
          totalRides,
          totalEarnings: driver.totalEarnings,
          averageRating: driver.averageRating
        }
      };
    } catch (error) {
      logger.error('Get driver statistics error:', error);
      throw error;
    }
  }

  /**
   * Get nearby drivers for admin/debugging
   */
  static async getNearbyDrivers(location, radiusKm = 10) {
    try {
      const drivers = await Driver.findAll({
        where: {
          isOnline: true,
          isAvailable: true,
          currentLocation: { [Op.not]: null }
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name', 'phone']
          },
          {
            model: Vehicle,
            as: 'vehicles',
            where: { isActive: true }
          }
        ]
      });

      // Filter by distance
      const nearbyDrivers = drivers.filter(driver => {
        if (!driver.currentLocation) return false;

        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          driver.currentLocation.latitude,
          driver.currentLocation.longitude
        );

        return distance <= radiusKm;
      });

      // Add distance to each driver
      nearbyDrivers.forEach(driver => {
        driver.dataValues.distance = calculateDistance(
          location.latitude,
          location.longitude,
          driver.currentLocation.latitude,
          driver.currentLocation.longitude
        );
      });

      // Sort by distance
      nearbyDrivers.sort((a, b) => a.dataValues.distance - b.dataValues.distance);

      return nearbyDrivers;
    } catch (error) {
      logger.error('Get nearby drivers error:', error);
      throw error;
    }
  }
}

module.exports = DriverService;
