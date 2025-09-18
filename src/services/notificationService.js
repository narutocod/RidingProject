const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');
const Bull = require('bull');

// Create notification queues
const emailQueue = new Bull('email notifications');
const smsQueue = new Bull('sms notifications');
const pushQueue = new Bull('push notifications');

class NotificationService {
  /**
   * Send ride request notification to drivers
   */
  static async notifyDriversOfRideRequest(rideData, nearbyDrivers) {
    try {
      const notifications = nearbyDrivers.map(driver => ({
        type: 'ride_request',
        userId: driver.userId,
        title: 'New Ride Request',
        message: `Ride request from ${rideData.pickupLocation.address} to ${rideData.dropLocation.address}`,
        data: {
          rideId: rideData.rideId,
          estimatedFare: rideData.estimatedFare,
          distance: rideData.estimatedDistance,
          pickupLocation: rideData.pickupLocation
        }
      }));

      // Send push notifications
      await this.sendPushNotifications(notifications);

      logger.info(`Ride request notifications sent to ${nearbyDrivers.length} drivers`);
      return true;
    } catch (error) {
      logger.error('Notify drivers error:', error);
      return false;
    }
  }

  /**
   * Send ride status update notification
   */
  static async notifyRideStatusUpdate(ride, status, recipientType = 'both') {
    try {
      const notifications = [];

      if (recipientType === 'rider' || recipientType === 'both') {
        notifications.push({
          type: 'ride_status',
          userId: ride.riderId,
          title: 'Ride Update',
          message: this.getRideStatusMessage(status, 'rider'),
          data: {
            rideId: ride.rideId,
            status,
            timestamp: new Date().toISOString()
          }
        });
      }

      if (recipientType === 'driver' || recipientType === 'both') {
        if (ride.driverId) {
          notifications.push({
            type: 'ride_status',
            userId: ride.driverId,
            title: 'Ride Update',
            message: this.getRideStatusMessage(status, 'driver'),
            data: {
              rideId: ride.rideId,
              status,
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      await this.sendPushNotifications(notifications);

      logger.info(`Ride status notifications sent for ride: ${ride.rideId}`);
      return true;
    } catch (error) {
      logger.error('Notify ride status error:', error);
      return false;
    }
  }

  /**
   * Send driver location update to rider
   */
  static async notifyDriverLocationUpdate(rideId, driverLocation, riderId) {
    try {
      const redis = getRedisClient();

      // Store latest location in Redis for real-time updates
      await redis.setEx(
        `driver_location_${rideId}`,
        300, // 5 minutes expiry
        JSON.stringify({
          ...driverLocation,
          timestamp: new Date().toISOString()
        })
      );

      // You can add Socket.IO emission here for real-time updates
      // io.to(`ride_${rideId}`).emit('driver_location_update', driverLocation);

      return true;
    } catch (error) {
      logger.error('Notify driver location error:', error);
      return false;
    }
  }

  /**
   * Send payment notification
   */
  static async notifyPaymentStatus(paymentData, userId) {
    try {
      const notification = {
        type: 'payment',
        userId: userId,
        title: 'Payment Update',
        message: paymentData.status === 'completed' 
          ? `Payment of ₹${paymentData.amount} completed successfully`
          : `Payment of ₹${paymentData.amount} failed. Please try again.`,
        data: {
          paymentId: paymentData.paymentId,
          amount: paymentData.amount,
          status: paymentData.status
        }
      };

      await this.sendPushNotifications([notification]);

      // Send email for payment confirmations
      if (paymentData.status === 'completed') {
        await this.sendEmail(
          userId,
          'Payment Confirmation',
          `Your payment of ₹${paymentData.amount} has been processed successfully.`
        );
      }

      logger.info(`Payment notification sent to user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Notify payment status error:', error);
      return false;
    }
  }

  /**
   * Send rating request notification
   */
  static async notifyRatingRequest(rideId, userId, userType) {
    try {
      const notification = {
        type: 'rating_request',
        userId: userId,
        title: 'Rate Your Ride',
        message: userType === 'rider' 
          ? 'How was your ride? Please rate your driver.'
          : 'How was your passenger? Please rate the rider.',
        data: {
          rideId: rideId,
          userType: userType
        }
      };

      await this.sendPushNotifications([notification]);

      logger.info(`Rating request sent to ${userType}: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Notify rating request error:', error);
      return false;
    }
  }

  /**
   * Send promotional notifications
   */
  static async sendPromotionalNotification(userIds, title, message, data = {}) {
    try {
      const notifications = userIds.map(userId => ({
        type: 'promotional',
        userId: userId,
        title: title,
        message: message,
        data: data
      }));

      await this.sendPushNotifications(notifications);

      logger.info(`Promotional notifications sent to ${userIds.length} users`);
      return true;
    } catch (error) {
      logger.error('Send promotional notification error:', error);
      return false;
    }
  }

  /**
   * Send push notifications (mock implementation)
   */
  static async sendPushNotifications(notifications) {
    try {
      // Add notifications to queue for processing
      const jobs = notifications.map(notification => 
        pushQueue.add('send_push', notification, {
          attempts: 3,
          backoff: 'exponential',
          delay: 1000
        })
      );

      await Promise.all(jobs);

      // Mock push notification logging
      notifications.forEach(notification => {
        logger.info(`Push notification: ${notification.title} -> User: ${notification.userId}`);
      });

      return true;
    } catch (error) {
      logger.error('Send push notifications error:', error);
      return false;
    }
  }

  /**
   * Send SMS notification (mock implementation)
   */
  static async sendSMS(phone, message) {
    try {
      await smsQueue.add('send_sms', {
        phone: phone,
        message: message,
        timestamp: new Date().toISOString()
      }, {
        attempts: 3,
        backoff: 'exponential'
      });

      logger.info(`SMS queued: ${phone.substring(0, 6)}****`);
      return true;
    } catch (error) {
      logger.error('Send SMS error:', error);
      return false;
    }
  }

  /**
   * Send email notification (mock implementation)
   */
  static async sendEmail(userId, subject, message) {
    try {
      await emailQueue.add('send_email', {
        userId: userId,
        subject: subject,
        message: message,
        timestamp: new Date().toISOString()
      }, {
        attempts: 3,
        backoff: 'exponential'
      });

      logger.info(`Email queued: ${subject} -> User: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Send email error:', error);
      return false;
    }
  }

  /**
   * Get ride status message
   */
  static getRideStatusMessage(status, userType) {
    const messages = {
      rider: {
        requested: 'Looking for a driver...',
        accepted: 'Driver found! They are on their way.',
        started: 'Your ride has started. Enjoy your trip!',
        completed: 'Ride completed. Thanks for using our service!',
        cancelled: 'Your ride has been cancelled.'
      },
      driver: {
        accepted: 'Ride accepted. Navigate to pickup location.',
        started: 'Trip started. Drive safely!',
        completed: 'Trip completed successfully.',
        cancelled: 'Ride has been cancelled.'
      }
    };

    return messages[userType][status] || 'Ride status updated';
  }

  /**
   * Process notification queues
   */
  static setupQueueProcessors() {
    // Process push notifications
    pushQueue.process('send_push', async (job) => {
      const { type, userId, title, message, data } = job.data;

      // Mock push notification processing
      logger.info(`Processing push notification: ${title} for user ${userId}`);

      // Store notification in database or send to push service
      // This is where you'd integrate with Firebase, APNs, etc.

      return { success: true, userId, title };
    });

    // Process SMS notifications
    smsQueue.process('send_sms', async (job) => {
      const { phone, message } = job.data;

      // Mock SMS processing
      logger.info(`Processing SMS to ${phone.substring(0, 6)}****`);

      // This is where you'd integrate with Twilio, AWS SNS, etc.

      return { success: true, phone };
    });

    // Process email notifications
    emailQueue.process('send_email', async (job) => {
      const { userId, subject, message } = job.data;

      // Mock email processing
      logger.info(`Processing email: ${subject} for user ${userId}`);

      // This is where you'd integrate with SendGrid, AWS SES, etc.

      return { success: true, userId, subject };
    });

    logger.info('Notification queue processors initialized');
  }

  /**
   * Get notification queues status
   */
  static async getQueueStatus() {
    try {
      const [pushStats, smsStats, emailStats] = await Promise.all([
        pushQueue.getJobCounts(),
        smsQueue.getJobCounts(),
        emailQueue.getJobCounts()
      ]);

      return {
        push: pushStats,
        sms: smsStats,
        email: emailStats
      };
    } catch (error) {
      logger.error('Get queue status error:', error);
      return {};
    }
  }
}

module.exports = NotificationService;
