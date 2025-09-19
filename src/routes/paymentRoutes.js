const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { createGeneralLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment and wallet management endpoints
 */

/**
 * @swagger
 * /api/payments/ride:
 *   post:
 *     summary: Process ride payment
 *     tags: [Payments]
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
 *               - paymentMethod
 *             properties:
 *               rideId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, wallet, card, upi]
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid request or insufficient funds
 */
router.post('/ride', verifyToken, checkRole(['rider']), createGeneralLimiter, PaymentController.processRidePayment);

/**
 * @swagger
 * /api/payments/wallet/add-money:
 *   post:
 *     summary: Add money to wallet
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 50000
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, upi, netbanking]
 *     responses:
 *       200:
 *         description: Money added to wallet successfully
 */
router.post('/wallet/add-money', verifyToken, createGeneralLimiter, PaymentController.addMoneyToWallet);

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get payment history
 *     tags: [Payments]
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
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 */
router.get('/history', verifyToken, PaymentController.getPaymentHistory);

/**
 * @swagger
 * /api/payments/wallet:
 *   get:
 *     summary: Get wallet details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet details retrieved successfully
 */
router.get('/wallet', verifyToken, PaymentController.getWalletDetails);

/**
 * @swagger
 * /api/payments/wallet/transactions:
 *   get:
 *     summary: Get wallet transactions
 *     tags: [Payments]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 *     responses:
 *       200:
 *         description: Wallet transactions retrieved successfully
 */
router.get('/wallet/transactions', verifyToken, PaymentController.getWalletTransactions);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 */
router.get('/:paymentId', verifyToken, PaymentController.getPaymentDetails);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Process refund (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - refundAmount
 *               - reason
 *             properties:
 *               paymentId:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */
router.post('/refund', verifyToken, checkRole(['admin']), PaymentController.processRefund);

module.exports = router;
