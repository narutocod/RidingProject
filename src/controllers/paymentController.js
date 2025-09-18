const PaymentService = require('../services/paymentService');
const ApiResponse = require('../utils/response');
const { paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

class PaymentController {
  /**
   * Process ride payment
   */
  static async processRidePayment(req, res) {
    try {
      const { rideId, paymentMethod } = req.body;
      const userId = req.user.userId;

      if (!rideId || !paymentMethod) {
        return ApiResponse.error(res, 'Ride ID and payment method are required', 400);
      }

      const validMethods = ['cash', 'wallet', 'card', 'upi'];
      if (!validMethods.includes(paymentMethod)) {
        return ApiResponse.error(res, 'Invalid payment method', 400);
      }

      const result = await PaymentService.processRidePayment(rideId, paymentMethod, userId);

      ApiResponse.success(res, result, 'Payment processed successfully');
    } catch (error) {
      logger.error('Process ride payment controller error:', error);

      if (error.message.includes('not found') || error.message.includes('not completed')) {
        return ApiResponse.notFound(res, error.message);
      }

      if (error.message.includes('Not authorized')) {
        return ApiResponse.forbidden(res, error.message);
      }

      if (error.message.includes('already processed') || error.message.includes('Insufficient')) {
        return ApiResponse.error(res, error.message, 400);
      }

      ApiResponse.error(res, 'Payment processing failed');
    }
  }

  /**
   * Add money to wallet
   */
  static async addMoneyToWallet(req, res) {
    try {
      const { amount, paymentMethod } = req.body;
      const userId = req.user.userId;

      if (!amount || !paymentMethod) {
        return ApiResponse.error(res, 'Amount and payment method are required', 400);
      }

      if (amount <= 0 || amount > 50000) {
        return ApiResponse.error(res, 'Amount must be between ₹1 and ₹50,000', 400);
      }

      const validMethods = ['card', 'upi', 'netbanking'];
      if (!validMethods.includes(paymentMethod)) {
        return ApiResponse.error(res, 'Invalid payment method for wallet top-up', 400);
      }

      const result = await PaymentService.addMoneyToWallet(userId, amount, paymentMethod);

      ApiResponse.success(res, result, 'Money added to wallet successfully');
    } catch (error) {
      logger.error('Add money to wallet controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      if (error.message.includes('Payment failed')) {
        return ApiResponse.error(res, error.message, 400);
      }

      ApiResponse.error(res, 'Failed to add money to wallet');
    }
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const result = await PaymentService.getPaymentHistory(userId, parseInt(page), parseInt(limit));

      ApiResponse.paginated(res, result.payments, result.pagination, 'Payment history retrieved successfully');
    } catch (error) {
      logger.error('Get payment history controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve payment history');
    }
  }

  /**
   * Get wallet details
   */
  static async getWalletDetails(req, res) {
    try {
      const userId = req.user.userId;
      const result = await PaymentService.getWalletDetails(userId);

      ApiResponse.success(res, result, 'Wallet details retrieved successfully');
    } catch (error) {
      logger.error('Get wallet details controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve wallet details');
    }
  }

  /**
   * Get wallet transactions
   */
  static async getWalletTransactions(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, type } = req.query;

      // This would need to be implemented in PaymentService
      // For now, return wallet details with transactions
      const wallet = await PaymentService.getWalletDetails(userId);

      ApiResponse.success(res, {
        transactions: wallet.transactions || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: wallet.transactions?.length || 0,
          totalPages: Math.ceil((wallet.transactions?.length || 0) / parseInt(limit))
        }
      }, 'Wallet transactions retrieved successfully');
    } catch (error) {
      logger.error('Get wallet transactions controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve wallet transactions');
    }
  }

  /**
   * Process refund (Admin only)
   */
  static async processRefund(req, res) {
    try {
      const { paymentId, refundAmount, reason } = req.body;

      if (!paymentId || !refundAmount || !reason) {
        return ApiResponse.error(res, 'Payment ID, refund amount, and reason are required', 400);
      }

      if (refundAmount <= 0) {
        return ApiResponse.error(res, 'Refund amount must be greater than 0', 400);
      }

      const result = await PaymentService.processRefund(paymentId, refundAmount, reason);

      ApiResponse.success(res, result, 'Refund processed successfully');
    } catch (error) {
      logger.error('Process refund controller error:', error);

      if (error.message.includes('not found')) {
        return ApiResponse.notFound(res, error.message);
      }

      if (error.message.includes('Cannot refund')) {
        return ApiResponse.error(res, error.message, 400);
      }

      ApiResponse.error(res, 'Refund processing failed');
    }
  }

  /**
   * Get payment details
   */
  static async getPaymentDetails(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.userId;

      if (!paymentId) {
        return ApiResponse.error(res, 'Payment ID is required', 400);
      }

      // This would need to be implemented in PaymentService
      // For now, return a placeholder response
      ApiResponse.success(res, {
        paymentId: paymentId,
        status: 'completed',
        message: 'Payment details endpoint - to be implemented'
      }, 'Payment details retrieved successfully');
    } catch (error) {
      logger.error('Get payment details controller error:', error);
      ApiResponse.error(res, 'Failed to retrieve payment details');
    }
  }
}

module.exports = PaymentController;
