const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Rider, Driver, Wallet } = require('../../models');
const { getRedisClient } = require('../config/redis');
const { generateOTP, formatPhoneNumber } = require('../utils/helpers');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Register new user
   */
  static async register(userData) {
    const { name, phone, password, role } = userData;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { phone } });
      if (existingUser) {
        throw new Error('User with this phone number already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await User.create({
        name,
        phone,
        passwordHash,
        role
      });

      // Create role-specific profile
      if (role === 'rider') {
        await Rider.create({ userId: user.id });
      } else if (role === 'driver') {
        await Driver.create({ userId: user.id });
      }

      // Create wallet for user
      await Wallet.create({ userId: user.id });

      // Generate OTP for verification
      const otp = generateOTP();
      const redis = getRedisClient();
      await redis.setEx(`otp_${phone}`, process.env.otpExpiryTime / 1000, otp);

      logger.info(`User registered: ${user.id} (${role})`);

      return {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role
        },
        otp // In production, this would be sent via SMS
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(phone, password) {
    try {
      // Find user
      const user = await User.findOne({
        where: { phone, isActive: true },
        include: [
          {
            model: Rider,
            as: 'riderProfile'
          },
          {
            model: Driver,
            as: 'driverProfile'
          }
        ]
      });

      if (!user) {
        throw new Error('Invalid phone number or password');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid phone number or password');
      }

      // Check if user is verified
      if (!user.isVerified) {
        // Generate new OTP
        const otp = generateOTP();
        const redis = getRedisClient();
        await redis.setEx(`otp_${phone}`, process.env.otpExpiryTime / 1000, otp);

        return {
          requiresVerification: true,
          otp // In production, this would be sent via SMS
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          phone: user.phone,
          role: user.role
        },
        process.env.jwtSecret,
        { expiresIn: process.env.jwtExpiresIn }
      );

      // Update last login
      await user.update({ lastLoginAt: new Date() });

      logger.info(`User logged in: ${user.id}`);

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture,
          profile: user.role === 'rider' ? user.riderProfile : user.driverProfile
        }
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP
   */
  static async verifyOTP(phone, otp) {
    try {
      const redis = getRedisClient();
      const storedOTP = await redis.get(`otp_${phone}`);

      if (!storedOTP || storedOTP !== otp) {
        throw new Error('Invalid or expired OTP');
      }

      // Mark user as verified
      const user = await User.findOne({ where: { phone } });
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({ isVerified: true });

      // Delete OTP from Redis
      await redis.del(`otp_${phone}`);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          phone: user.phone,
          role: user.role
        },
        process.env.jwtSecret,
        { expiresIn: process.env.jwtExpiresIn }
      );

      logger.info(`User verified: ${user.id}`);

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified
        }
      };
    } catch (error) {
      logger.error('OTP verification error:', error);
      throw error;
    }
  }

  /**
   * Resend OTP
   */
  static async resendOTP(phone) {
    try {
      const user = await User.findOne({ where: { phone } });
      if (!user) {
        throw new Error('User not found');
      }

      const otp = generateOTP();
      const redis = getRedisClient();
      await redis.setEx(`otp_${phone}`, process.env.otpExpiryTime / 1000, otp);

      logger.info(`OTP resent for user: ${user.id}`);

      return { otp }; // In production, this would be sent via SMS
    } catch (error) {
      logger.error('Resend OTP error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(token) {
    try {
      // Add token to blacklist
      const redis = getRedisClient();
      const decoded = jwt.decode(token);
      const expiryTime = decoded.exp - Math.floor(Date.now() / 1000);

      if (expiryTime > 0) {
        await redis.setEx(`blacklist_${token}`, expiryTime, 'true');
      }

      logger.info('User logged out');
      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await user.update({ passwordHash: newPasswordHash });

      logger.info(`Password changed for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }
}

module.exports = AuthService;
