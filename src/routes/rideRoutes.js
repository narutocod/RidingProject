const express = require('express');
const router = express.Router();
const RideController = require('../controllers/rideController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { createGeneralLimiter } = require('../middleware/rateLimiter');
/**
 * @swagger
 * tags:
 *   name: Rides
 *   description: Ride management endpoints
 */

/**
 * @swagger
 * /api/rides/book:
 *   post:
 *     summary: Book a new ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupLocation
 *               - dropLocation
 *               - rideType
 *             properties:
 *               pickupLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *               dropLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *               rideType:
 *                 type: string
 *                 enum: [economy, comfort, premium]
 *     responses:
 *       201:
 *         description: Ride booked successfully
 *       400:
 *         description: Validation error
 */
router.post('/book', verifyToken, checkRole(['rider']), createGeneralLimiter(), RideController.bookRide);

/**
 * @swagger
 * /api/rides/{rideId}/accept:
 *   post:
 *     summary: Accept ride by driver
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ride accepted successfully
 *       404:
 *         description: Ride not found
 */
router.post('/:rideId/accept', verifyToken, checkRole(['driver']), RideController.acceptRide);

/**
 * @swagger
 * /api/rides/{rideId}/start:
 *   post:
 *     summary: Start ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ride started successfully
 */
router.post('/:rideId/start', verifyToken, checkRole(['driver']), RideController.startRide);

/**
 * @swagger
 * /api/rides/{rideId}/complete:
 *   post:
 *     summary: Complete ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actualDistance:
 *                 type: number
 *               odometerReading:
 *                 type: number
 *     responses:
 *       200:
 *         description: Ride completed successfully
 */
router.post('/:rideId/complete', verifyToken, checkRole(['driver']), RideController.completeRide);

/**
 * @swagger
 * /api/rides/{rideId}/cancel:
 *   post:
 *     summary: Cancel ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ride cancelled successfully
 */
router.post('/:rideId/cancel', verifyToken, checkRole(['rider', 'driver']), RideController.cancelRide);

/**
 * @swagger
 * /api/rides/{rideId}:
 *   get:
 *     summary: Get ride details
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ride details retrieved successfully
 */
router.get('/:rideId', verifyToken, RideController.getRideDetails);

/**
 * @swagger
 * /api/rides/{rideId}/track:
 *   post:
 *     summary: Track ride location
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               accuracy:
 *                 type: number
 *               heading:
 *                 type: number
 *               speed:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated successfully
 */
router.post('/:rideId/track', verifyToken, checkRole(['driver']), RideController.trackRide);

/**
 * @swagger
 * /api/rides/estimate-fare:
 *   post:
 *     summary: Estimate ride fare
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupLocation
 *               - dropLocation
 *               - rideType
 *             properties:
 *               pickupLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               dropLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               rideType:
 *                 type: string
 *                 enum: [economy, comfort, premium]
 *     responses:
 *       200:
 *         description: Fare estimated successfully
 */
router.post('/estimate-fare', verifyToken, RideController.estimateFare);

module.exports = router;
