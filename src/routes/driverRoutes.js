const express = require('express');
const router = express.Router();
const DriverController = require('../controllers/driverController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { uploadDriverDocs, handleUploadError } = require('../middleware/upload');
const { createGeneralLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Driver
 *   description: Driver management endpoints
 */

/**
 * @swagger
 * /api/driver/profile:
 *   get:
 *     summary: Get driver profile
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile retrieved successfully
 *       404:
 *         description: Driver profile not found
 */
router.get('/profile', verifyToken, checkRole(['driver']), DriverController.getProfile);

/**
 * @swagger
 * /api/driver/profile:
 *   put:
 *     summary: Update driver profile
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               licenseNumber:
 *                 type: string
 *               licenseExpiry:
 *                 type: string
 *                 format: date
 *               driverLicense:
 *                 type: string
 *                 format: binary
 *               vehicleRegistration:
 *                 type: string
 *                 format: binary
 *               vehicleInsurance:
 *                 type: string
 *                 format: binary
 *               vehicleDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', verifyToken, checkRole(['driver']), uploadDriverDocs, handleUploadError, DriverController.updateProfile);

/**
 * @swagger
 * /api/driver/location:
 *   post:
 *     summary: Update driver location
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
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
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location updated successfully
 */
router.post('/location', verifyToken, checkRole(['driver']), createGeneralLimiter, DriverController.updateLocation);

/**
 * @swagger
 * /api/driver/toggle-online:
 *   post:
 *     summary: Toggle driver online status
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Online status updated successfully
 */
router.post('/toggle-online', verifyToken, checkRole(['driver']), DriverController.toggleOnlineStatus);

/**
 * @swagger
 * /api/driver/toggle-availability:
 *   post:
 *     summary: Toggle driver availability
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Availability updated successfully
 */
router.post('/toggle-availability', verifyToken, checkRole(['driver']), DriverController.toggleAvailability);

/**
 * @swagger
 * /api/driver/earnings:
 *   get:
 *     summary: Get driver earnings
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeFrame
 *         schema:
 *           type: string
 *           enum: [today, week, month]
 *           default: week
 *     responses:
 *       200:
 *         description: Earnings retrieved successfully
 */
router.get('/earnings', verifyToken, checkRole(['driver']), DriverController.getEarnings);

/**
 * @swagger
 * /api/driver/statistics:
 *   get:
 *     summary: Get driver statistics
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/statistics', verifyToken, checkRole(['driver']), DriverController.getStatistics);

/**
 * @swagger
 * /api/driver/vehicle:
 *   put:
 *     summary: Update vehicle details
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleType
 *               - vehicleNumber
 *               - vehicleBrand
 *               - vehicleModel
 *               - vehicleColor
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [car, bike, auto]
 *               vehicleNumber:
 *                 type: string
 *               vehicleBrand:
 *                 type: string
 *               vehicleModel:
 *                 type: string
 *               vehicleColor:
 *                 type: string
 *               vehicleRegistration:
 *                 type: string
 *                 format: binary
 *               vehicleInsurance:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Vehicle details updated successfully
 */
router.put('/vehicle', verifyToken, checkRole(['driver']), uploadDriverDocs, handleUploadError, DriverController.updateVehicle);

/**
 * @swagger
 * /api/driver/dashboard:
 *   get:
 *     summary: Get driver dashboard data
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard', verifyToken, checkRole(['driver']), DriverController.getDashboard);

/**
 * @swagger
 * /api/driver/status:
 *   get:
 *     summary: Get driver current status
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current status retrieved successfully
 */
router.get('/status', verifyToken, checkRole(['driver']), DriverController.getCurrentStatus);

/**
 * @swagger
 * /api/driver/upload-documents:
 *   post:
 *     summary: Upload driver documents
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               driverLicense:
 *                 type: string
 *                 format: binary
 *               vehicleRegistration:
 *                 type: string
 *                 format: binary
 *               vehicleInsurance:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Documents uploaded successfully
 */
router.post('/upload-documents', verifyToken, checkRole(['driver']), uploadDriverDocs, handleUploadError, DriverController.uploadDocuments);

module.exports = router;
