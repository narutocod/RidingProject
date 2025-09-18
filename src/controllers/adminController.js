const { User, Driver, Rider, Ride, Payment, Vehicle } = require('../../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/response');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

class AdminController {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(req, res) {
    try {
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [
        totalUsers,
        totalDrivers,
        totalRiders,
        totalRides,
        todayRides,
        monthlyRides,
        completedRides,
        activeDrivers,
        verifiedDrivers
      ] = await Promise.all([
        User.count(),
        Driver.count(),
        Rider.count(),
        Ride.count(),
        Ride.count({ where: { createdAt: { [Op.gte]: startOfToday } } }),
        Ride.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
        Ride.count({ where: { status: 'completed' } }),
        Driver.count({ where: { isOnline: true } }),
        Driver.count({ where: { isVerified: true } })
      ]);

      // Calculate revenue (sum of completed ride payments)
      const revenueResult = await Payment.sum('amount', {
        where: { paymentStatus: 'completed' }
      });
      const totalRevenue = revenueResult || 0;

      const stats = {
        users: {
          total: totalUsers,
          drivers: totalDrivers,
          riders: totalRiders
        },
        rides: {
          total: totalRides,
          today: todayRides,
          monthly: monthlyRides,
          completed: completedRides
        },
        drivers: {
          total: totalDrivers,
          active: activeDrivers,
          verified: verifiedDrivers,
          verificationRate: totalDrivers > 0 ? ((verifiedDrivers / totalDrivers) * 100).toFixed(1) : 0
        },
        revenue: {
          total: parseFloat(totalRevenue).toFixed(2),
          commission: parseFloat(totalRevenue * 0.1).toFixed(2) // 10% commission
        }
      };

      ApiResponse.success(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      logger.error('Get dashboard stats controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve dashboard statistics');
    }
  }

  /**
   * Get all users with pagination
   */
  static async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, search, isActive } = req.query;
      const pagination = paginate(page, limit);

      const whereClause = {};

      if (role && ['rider', 'driver', 'admin'].includes(role)) {
        whereClause.role = role;
      }

      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const users = await User.findAndCountAll({
        where: whereClause,
        attributes: ['id', 'name', 'phone', 'email', 'role', 'isActive', 'isVerified', 'createdAt'],
        order: [['createdAt', 'DESC']],
        ...pagination
      });

      ApiResponse.paginated(res, users.rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.count
      }, 'Users retrieved successfully');
    } catch (error) {
      logger.error('Get users controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve users');
    }
  }

  /**
   * Get all drivers with details
   */
  static async getDrivers(req, res) {
    try {
      const { page = 1, limit = 20, isVerified, isOnline, search } = req.query;
      const pagination = paginate(page, limit);

      const whereClause = {};

      if (isVerified !== undefined) {
        whereClause.isVerified = isVerified === 'true';
      }

      if (isOnline !== undefined) {
        whereClause.isOnline = isOnline === 'true';
      }

      const userWhereClause = {};
      if (search) {
        userWhereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const drivers = await Driver.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            where: userWhereClause,
            attributes: ['id', 'name', 'phone', 'email', 'isActive', 'createdAt']
          },
          {
            model: Vehicle,
            as: 'vehicles',
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        ...pagination
      });

      ApiResponse.paginated(res, drivers.rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: drivers.count
      }, 'Drivers retrieved successfully');
    } catch (error) {
      logger.error('Get drivers controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve drivers');
    }
  }

  /**
   * Verify/Unverify driver
   */
  static async verifyDriver(req, res) {
    try {
      const { driverId } = req.params;
      const { isVerified } = req.body;

      if (typeof isVerified !== 'boolean') {
        return ApiResponse.error(res, 'isVerified must be a boolean value', 400);
      }

      const driver = await Driver.findByPk(driverId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['name', 'phone']
          }
        ]
      });

      if (!driver) {
        return ApiResponse.notFound(res, 'Driver not found');
      }

      await driver.update({ 
        isVerified,
        documentsVerified: isVerified 
      });

      logger.info(`Driver ${isVerified ? 'verified' : 'unverified'}: ${driverId} by admin: ${req.user.userId}`);

      ApiResponse.success(res, {
        driverId: driver.id,
        driverName: driver.user.name,
        isVerified: driver.isVerified
      }, `Driver ${isVerified ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      logger.error('Verify driver controller error:', error);
      ApiResponse.error(res, 'Failed to update driver verification status');
    }
  }

  /**
   * Get all rides with filters
   */
  static async getRides(req, res) {
    try {
      const { page = 1, limit = 20, status, startDate, endDate, search } = req.query;
      const pagination = paginate(page, limit);

      const whereClause = {};

      if (status && ['requested', 'accepted', 'started', 'completed', 'cancelled'].includes(status)) {
        whereClause.status = status;
      }

      if (startDate) {
        whereClause.createdAt = { [Op.gte]: new Date(startDate) };
      }

      if (endDate) {
        if (whereClause.createdAt) {
          whereClause.createdAt[Op.lte] = new Date(endDate);
        } else {
          whereClause.createdAt = { [Op.lte]: new Date(endDate) };
        }
      }

      if (search) {
        whereClause.rideId = { [Op.iLike]: `%${search}%` };
      }

      const rides = await Ride.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'rider',
            attributes: ['id', 'name', 'phone']
          },
          {
            model: User,
            as: 'driver',
            attributes: ['id', 'name', 'phone'],
            required: false
          },
          {
            model: Vehicle,
            as: 'vehicle',
            attributes: ['vehicleType', 'vehicleNumber'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        ...pagination
      });

      ApiResponse.paginated(res, rides.rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: rides.count
      }, 'Rides retrieved successfully');
    } catch (error) {
      logger.error('Get rides controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve rides');
    }
  }

  /**
   * Get payments with filters
   */
  static async getPayments(req, res) {
    try {
      const { page = 1, limit = 20, status, method, startDate, endDate } = req.query;
      const pagination = paginate(page, limit);

      const whereClause = {};

      if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status)) {
        whereClause.paymentStatus = status;
      }

      if (method && ['cash', 'wallet', 'card', 'upi'].includes(method)) {
        whereClause.paymentMethod = method;
      }

      if (startDate) {
        whereClause.createdAt = { [Op.gte]: new Date(startDate) };
      }

      if (endDate) {
        if (whereClause.createdAt) {
          whereClause.createdAt[Op.lte] = new Date(endDate);
        } else {
          whereClause.createdAt = { [Op.lte]: new Date(endDate) };
        }
      }

      const payments = await Payment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'phone']
          },
          {
            model: Ride,
            as: 'ride',
            attributes: ['rideId', 'pickupLocation', 'dropLocation']
          }
        ],
        order: [['createdAt', 'DESC']],
        ...pagination
      });

      ApiResponse.paginated(res, payments.rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        total: payments.count
      }, 'Payments retrieved successfully');
    } catch (error) {
      logger.error('Get payments controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve payments');
    }
  }

  /**
   * Deactivate/Activate user
   */
  static async toggleUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return ApiResponse.error(res, 'isActive must be a boolean value', 400);
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return ApiResponse.notFound(res, 'User not found');
      }

      await user.update({ isActive });

      logger.info(`User ${isActive ? 'activated' : 'deactivated'}: ${userId} by admin: ${req.user.userId}`);

      ApiResponse.success(res, {
        userId: user.id,
        userName: user.name,
        isActive: user.isActive
      }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      logger.error('Toggle user status controller error:', error);
      ApiResponse.error(res, 'Failed to update user status');
    }
  }

  /**
   * Get system statistics
   */
  static async getSystemStats(req, res) {
    try {
      // Get various system metrics
      const stats = {
        users: {
          totalRegistrations: await User.count(),
          activeUsers: await User.count({ where: { isActive: true } }),
          verifiedUsers: await User.count({ where: { isVerified: true } })
        },
        rides: {
          totalRides: await Ride.count(),
          completedRides: await Ride.count({ where: { status: 'completed' } }),
          cancelledRides: await Ride.count({ where: { status: 'cancelled' } }),
          activeRides: await Ride.count({ where: { status: { [Op.in]: ['requested', 'accepted', 'started'] } } })
        },
        revenue: {
          totalRevenue: await Payment.sum('amount', { where: { paymentStatus: 'completed' } }) || 0,
          totalRefunds: await Payment.sum('refundAmount', { where: { paymentStatus: 'refunded' } }) || 0,
          pendingPayments: await Payment.sum('amount', { where: { paymentStatus: 'pending' } }) || 0
        },
        drivers: {
          totalDrivers: await Driver.count(),
          onlineDrivers: await Driver.count({ where: { isOnline: true } }),
          availableDrivers: await Driver.count({ where: { isOnline: true, isAvailable: true } }),
          verifiedDrivers: await Driver.count({ where: { isVerified: true } })
        }
      };

      ApiResponse.success(res, stats, 'System statistics retrieved successfully');
    } catch (error) {
      logger.error('Get system stats controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve system statistics');
    }
  }
}

module.exports = AdminController;
