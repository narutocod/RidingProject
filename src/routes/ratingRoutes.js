const express = require('express');
const router = express.Router();
const RatingController = require('../controllers/ratingController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { createGeneralLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Ratings
 *   description: Rating and review management endpoints
 */

/**
 * @swagger
 * /api/ratings/submit:
 *   post:
 *     summary: Submit rating for a ride
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rideId
 *               - rating
 *             properties:
 *               rideId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               feedback:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Rating submitted successfully
 *       400:
 *         description: Invalid request or already rated
 */
router.post('/submit', verifyToken, checkRole(['rider', 'driver']), createGeneralLimiter(), RatingController.submitRating);

/**
 * @swagger
 * /api/ratings/user/{userId}:
 *   get:
 *     summary: Get ratings for a user
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Ratings retrieved successfully
 */
router.get('/user/:userId', verifyToken, RatingController.getUserRatings);

/**
 * @swagger
 * /api/ratings/my-statistics:
 *   get:
 *     summary: Get rating statistics for current user
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rating statistics retrieved successfully
 */
router.get('/my-statistics', verifyToken, RatingController.getMyRatingStatistics);

/**
 * @swagger
 * /api/ratings/statistics/{userId}:
 *   get:
 *     summary: Get rating statistics for a user
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: ratingType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [rider_to_driver, driver_to_rider]
 *     responses:
 *       200:
 *         description: Rating statistics retrieved successfully
 */
router.get('/statistics/:userId', verifyToken, RatingController.getUserRatingStatistics);

/**
 * @swagger
 * /api/ratings/ride/{rideId}:
 *   get:
 *     summary: Get ratings for a ride
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ride ratings retrieved successfully
 */
router.get('/ride/:rideId', verifyToken, RatingController.getRideRatings);

/**
 * @swagger
 * /api/ratings/top-drivers:
 *   get:
 *     summary: Get top rated drivers
 *     tags: [Ratings]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top rated drivers retrieved successfully
 */
router.get('/top-drivers', RatingController.getTopRatedDrivers);


module.exports = router;
