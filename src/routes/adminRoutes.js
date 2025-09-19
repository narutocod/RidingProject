const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 */
router.get('/dashboard', verifyToken, checkRole(['admin']), AdminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with pagination and filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [rider, driver, admin]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', verifyToken, checkRole(['admin']), AdminController.getUsers);

/**
 * @swagger
 * /api/admin/drivers:
 *   get:
 *     summary: Get all drivers with details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isOnline
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Drivers retrieved successfully
 */
router.get('/drivers', verifyToken, checkRole(['admin']), AdminController.getDrivers);

/**
 * @swagger
 * /api/admin/drivers/{driverId}/verify:
 *   put:
 *     summary: Verify or unverify driver
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVerified
 *             properties:
 *               isVerified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Driver verification status updated successfully
 */
router.put('/drivers/:driverId/verify', verifyToken, checkRole(['admin']), AdminController.verifyDriver);

/**
 * @swagger
 * /api/admin/rides:
 *   get:
 *     summary: Get all rides with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [requested, accepted, started, completed, cancelled]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rides retrieved successfully
 */
router.get('/rides', verifyToken, checkRole(['admin']), AdminController.getRides);

/**
 * @swagger
 * /api/admin/payments:
 *   get:
 *     summary: Get all payments with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [cash, wallet, card, upi]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.get('/payments', verifyToken, checkRole(['admin']), AdminController.getPayments);

/**
 * @swagger
 * /api/admin/users/{userId}/toggle-status:
 *   put:
 *     summary: Activate or deactivate user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.put('/users/:userId/toggle-status', verifyToken, checkRole(['admin']), AdminController.toggleUserStatus);

/**
 * @swagger
 * /api/admin/system-stats:
 *   get:
 *     summary: Get comprehensive system statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 */
router.get('/system-stats', verifyToken, checkRole(['admin']), AdminController.getSystemStats);

module.exports = router;
