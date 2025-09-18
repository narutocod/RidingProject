const { Op } = require('sequelize');
const { Payment, Ride, User, Wallet, WalletTransaction } = require('../../models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class PaymentService {
  /**
   * Process ride payment
   */
  static async processRidePayment(rideId, paymentMethod, userId) {
    try {
      const ride = await Ride.findOne({
        where: { rideId, status: 'completed' },
        include: [
          {
            model: User,
            as: 'rider'
          },
          {
            model: User,
            as: 'driver'
          }
        ]
      });

      if (!ride) {
        throw new Error('Ride not found or not completed');
      }

      if (ride.riderId !== userId) {
        throw new Error('Not authorized to make payment for this ride');
      }

      // Check if payment already exists
      const existingPayment = await Payment.findOne({
        where: { rideId: ride.id }
      });

      if (existingPayment) {
        throw new Error('Payment already processed for this ride');
      }

      let paymentResult;

      switch (paymentMethod) {
        case 'wallet':
          paymentResult = await this.processWalletPayment(ride, userId);
          break;
        case 'card':
        case 'upi':
          paymentResult = await this.processGatewayPayment(ride, paymentMethod);
          break;
        case 'cash':
          paymentResult = await this.processCashPayment(ride);
          break;
        default:
          throw new Error('Invalid payment method');
      }

      // Create payment record
      const payment = await Payment.create({
        rideId: ride.id,
        paymentId: paymentResult.paymentId,
        userId: userId,
        amount: ride.actualFare,
        paymentMethod,
        paymentStatus: paymentResult.status,
        gatewayTransactionId: paymentResult.transactionId,
        gatewayResponse: paymentResult.gatewayResponse,
        processedAt: paymentResult.status === 'completed' ? new Date() : null
      });

      // Update ride payment status
      await ride.update({
        paymentStatus: paymentResult.status
      });

      // If payment successful, credit driver's wallet
      if (paymentResult.status === 'completed') {
        await this.creditDriverEarnings(ride.driverId, ride.actualFare, ride.id);
      }

      logger.info(`Payment processed: ${payment.paymentId} for ride: ${rideId}`);

      return {
        paymentId: payment.paymentId,
        amount: payment.amount,
        status: payment.paymentStatus,
        method: paymentMethod,
        processedAt: payment.processedAt
      };
    } catch (error) {
      logger.error('Process payment error:', error);
      throw error;
    }
  }

  /**
   * Process wallet payment
   */
  static async processWalletPayment(ride, userId) {
    try {
      const wallet = await Wallet.findOne({ where: { userId } });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (parseFloat(wallet.balance) < parseFloat(ride.actualFare)) {
        throw new Error('Insufficient wallet balance');
      }

      // Debit from wallet
      const newBalance = parseFloat(wallet.balance) - parseFloat(ride.actualFare);
      await wallet.update({
        balance: newBalance,
        totalSpent: parseFloat(wallet.totalSpent) + parseFloat(ride.actualFare)
      });

      // Create wallet transaction
      await WalletTransaction.create({
        walletId: wallet.id,
        transactionId: `TXN_${uuidv4().substring(0, 8).toUpperCase()}`,
        type: 'debit',
        amount: ride.actualFare,
        description: `Payment for ride ${ride.rideId}`,
        referenceType: 'ride_payment',
        referenceId: ride.id,
        balanceAfter: newBalance
      });

      return {
        paymentId: `PAY_${uuidv4().substring(0, 8).toUpperCase()}`,
        status: 'completed',
        transactionId: null,
        gatewayResponse: null
      };
    } catch (error) {
      logger.error('Wallet payment error:', error);
      throw error;
    }
  }

  /**
   * Process gateway payment (mock implementation)
   */
  static async processGatewayPayment(ride, paymentMethod) {
    try {
      // Mock payment gateway integration
      const mockGatewayResponse = {
        success: Math.random() > 0.1, // 90% success rate for testing
        transactionId: `TXN_${Date.now()}`,
        amount: ride.actualFare,
        currency: 'INR',
        timestamp: new Date().toISOString()
      };

      // Simulate gateway processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      const paymentId = `PAY_${uuidv4().substring(0, 8).toUpperCase()}`;

      if (mockGatewayResponse.success) {
        return {
          paymentId,
          status: 'completed',
          transactionId: mockGatewayResponse.transactionId,
          gatewayResponse: mockGatewayResponse
        };
      } else {
        return {
          paymentId,
          status: 'failed',
          transactionId: mockGatewayResponse.transactionId,
          gatewayResponse: {
            ...mockGatewayResponse,
            error: 'Payment declined by bank'
          }
        };
      }
    } catch (error) {
      logger.error('Gateway payment error:', error);
      throw error;
    }
  }

  /**
   * Process cash payment
   */
  static async processCashPayment(ride) {
    return {
      paymentId: `PAY_${uuidv4().substring(0, 8).toUpperCase()}`,
      status: 'completed',
      transactionId: null,
      gatewayResponse: { method: 'cash' }
    };
  }

  /**
   * Credit driver earnings to wallet
   */
  static async creditDriverEarnings(driverId, amount, rideId) {
    try {
      let wallet = await Wallet.findOne({ where: { userId: driverId } });

      if (!wallet) {
        wallet = await Wallet.create({ userId: driverId });
      }

      // Calculate driver's share (90% of fare, 10% commission)
      const driverShare = parseFloat(amount) * 0.9;
      const commission = parseFloat(amount) * 0.1;

      const newBalance = parseFloat(wallet.balance) + driverShare;

      await wallet.update({
        balance: newBalance,
        totalEarnings: parseFloat(wallet.totalEarnings) + driverShare
      });

      // Create wallet transaction
      await WalletTransaction.create({
        walletId: wallet.id,
        transactionId: `TXN_${uuidv4().substring(0, 8).toUpperCase()}`,
        type: 'credit',
        amount: driverShare,
        description: `Earnings from ride (${amount} - ${commission} commission)`,
        referenceType: 'earnings',
        referenceId: rideId,
        balanceAfter: newBalance
      });

      logger.info(`Driver earnings credited: ${driverId} - Amount: ${driverShare}`);

      return driverShare;
    } catch (error) {
      logger.error('Credit driver earnings error:', error);
      throw error;
    }
  }

  /**
   * Add money to wallet
   */
  static async addMoneyToWallet(userId, amount, paymentMethod) {
    try {
      const wallet = await Wallet.findOne({ where: { userId } });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Mock gateway payment for wallet top-up
      const mockGatewayResponse = {
        success: Math.random() > 0.05, // 95% success rate
        transactionId: `TXN_${Date.now()}`,
        amount: amount,
        currency: 'INR',
        timestamp: new Date().toISOString()
      };

      if (!mockGatewayResponse.success) {
        throw new Error('Payment failed. Please try again.');
      }

      const newBalance = parseFloat(wallet.balance) + parseFloat(amount);

      await wallet.update({ balance: newBalance });

      // Create wallet transaction
      const transaction = await WalletTransaction.create({
        walletId: wallet.id,
        transactionId: `TXN_${uuidv4().substring(0, 8).toUpperCase()}`,
        type: 'credit',
        amount: amount,
        description: `Wallet top-up via ${paymentMethod}`,
        referenceType: 'wallet_topup',
        balanceAfter: newBalance
      });

      logger.info(`Wallet topped up: ${userId} - Amount: ${amount}`);

      return {
        transactionId: transaction.transactionId,
        amount: amount,
        newBalance: newBalance,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Add money to wallet error:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const payments = await Payment.findAndCountAll({
        where: { userId },
        include: [
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
        payments: payments.rows,
        pagination: {
          page,
          limit,
          total: payments.count,
          totalPages: Math.ceil(payments.count / limit)
        }
      };
    } catch (error) {
      logger.error('Get payment history error:', error);
      throw error;
    }
  }

  /**
   * Get wallet details
   */
  static async getWalletDetails(userId) {
    try {
      const wallet = await Wallet.findOne({
        where: { userId },
        include: [
          {
            model: WalletTransaction,
            as: 'transactions',
            limit: 10,
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!wallet) {
        // Create wallet if doesn't exist
        const newWallet = await Wallet.create({ userId });
        return {
          ...newWallet.toJSON(),
          transactions: []
        };
      }

      return wallet;
    } catch (error) {
      logger.error('Get wallet details error:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  static async processRefund(paymentId, refundAmount, reason) {
    try {
      const payment = await Payment.findOne({
        where: { paymentId },
        include: [
          {
            model: Ride,
            as: 'ride'
          }
        ]
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.paymentStatus !== 'completed') {
        throw new Error('Cannot refund uncompleted payment');
      }

      // Update payment record
      await payment.update({
        refundAmount,
        refundReason: reason,
        paymentStatus: 'refunded'
      });

      // Credit to user's wallet
      const wallet = await Wallet.findOne({ where: { userId: payment.userId } });
      if (wallet) {
        const newBalance = parseFloat(wallet.balance) + parseFloat(refundAmount);

        await wallet.update({ balance: newBalance });

        await WalletTransaction.create({
          walletId: wallet.id,
          transactionId: `TXN_${uuidv4().substring(0, 8).toUpperCase()}`,
          type: 'credit',
          amount: refundAmount,
          description: `Refund for ride ${payment.ride.rideId} - ${reason}`,
          referenceType: 'ride_refund',
          referenceId: payment.ride.id,
          balanceAfter: newBalance
        });
      }

      logger.info(`Refund processed: ${paymentId} - Amount: ${refundAmount}`);

      return {
        paymentId: payment.paymentId,
        refundAmount,
        status: 'refunded',
        reason
      };
    } catch (error) {
      logger.error('Process refund error:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;
