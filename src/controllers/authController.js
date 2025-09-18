const AuthService = require('../services/authService');
const ApiResponse = require('../utils/response');
const { userRegistrationSchema, userLoginSchema, otpVerificationSchema } = require('../utils/validators');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Register new user
   */
  static async register(req, res) {
    try {
      // Validate request data
      const { error, value } = userRegistrationSchema.validate(req.body);
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const result = await AuthService.register(value);

      ApiResponse.success(res, result, 'User registered successfully. Please verify your OTP.', 201);
    } catch (error) {
      logger.error('Register controller error:', error);

      if (error.message.includes('already exists')) {
        return ApiResponse.error(res, error.message, 400);
      }

      ApiResponse.error(res, 'Registration failed');
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      // Validate request data
      const { error, value } = userLoginSchema.validate(req.body);
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const { phone, password } = value;
      const result = await AuthService.login(phone, password);

      if (result.requiresVerification) {
        return ApiResponse.success(res, result, 'Please verify your OTP to complete login', 200);
      }

      ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      logger.error('Login controller error:', error);

      if (error.message.includes('Invalid phone number or password')) {
        return ApiResponse.unauthorized(res, 'Invalid credentials');
      }

      ApiResponse.error(res, 'Login failed');
    }
  }

  /**
   * Verify OTP
   */
  static async verifyOTP(req, res) {
    try {
      // Validate request data
      const { error, value } = otpVerificationSchema.validate(req.body);
      if (error) {
        return ApiResponse.validationError(res, error);
      }

      const { phone, otp } = value;
      const result = await AuthService.verifyOTP(phone, otp);

      ApiResponse.success(res, result, 'OTP verified successfully');
    } catch (error) {
      logger.error('Verify OTP controller error:', error);

      if (error.message.includes('Invalid or expired OTP')) {
        return ApiResponse.error(res, error.message, 400);
      }

      ApiResponse.error(res, 'OTP verification failed');
    }
  }

  /**
   * Resend OTP
   */
  static async resendOTP(req, res) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return ApiResponse.error(res, 'Phone number is required', 400);
      }

      const result = await AuthService.resendOTP(phone);

      ApiResponse.success(res, result, 'OTP sent successfully');
    } catch (error) {
      logger.error('Resend OTP controller error:', error);

      if (error.message.includes('User not found')) {
        return ApiResponse.notFound(res, 'User not found');
      }

      ApiResponse.error(res, 'Failed to send OTP');
    }
  }

  /**
   * Logout user
   */
  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return ApiResponse.error(res, 'No token provided', 400);
      }

      await AuthService.logout(token);

      ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      logger.error('Logout controller error:', error);
      ApiResponse.error(res, 'Logout failed');
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      if (!currentPassword || !newPassword) {
        return ApiResponse.error(res, 'Current password and new password are required', 400);
      }

      if (newPassword.length < 6) {
        return ApiResponse.error(res, 'New password must be at least 6 characters long', 400);
      }

      await AuthService.changePassword(userId, currentPassword, newPassword);

      ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
      logger.error('Change password controller error:', error);

      if (error.message.includes('Current password is incorrect')) {
        return ApiResponse.error(res, error.message, 400);
      }

      ApiResponse.error(res, 'Failed to change password');
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      // This could be expanded to fetch full user profile
      const userProfile = {
        userId: req.user.userId,
        phone: req.user.phone,
        role: req.user.role
      };

      ApiResponse.success(res, userProfile, 'Profile retrieved successfully');
    } catch (error) {
      logger.error('Get profile controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve profile');
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(req, res) {
    try {
      // For now, return the same token
      // In production, you might want to implement proper token refresh logic
      const newToken = req.headers.authorization?.split(' ')[1];

      if (!newToken) {
        return ApiResponse.unauthorized(res, 'No token provided');
      }

      ApiResponse.success(res, { token: newToken }, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Refresh token controller error:', error);
      ApiResponse.error(res, 'Failed to refresh token');
    }
  }
}

module.exports = AuthController;
