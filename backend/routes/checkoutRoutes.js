import express from 'express';
import { createOrder, verifyPayment, getOrders } from '../controllers/checkoutController.js';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(checkJwt, ensureUser);

// Apply strict rate limiting to payment triggers
router.post('/create-order', paymentLimiter, createOrder);
router.post('/verify', paymentLimiter, verifyPayment);
router.get('/history', getOrders);

export default router;
