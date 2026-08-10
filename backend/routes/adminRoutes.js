import express from 'express';
import { checkJwt, ensureUser, requireAdmin } from '../middleware/auth.js';
import { getAdminStats, getAllOrders, getOrderDetail } from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require: valid JWT + user in DB + must be mindfuelspublisher@gmail.com
router.use(checkJwt, ensureUser, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderDetail);

export default router;
