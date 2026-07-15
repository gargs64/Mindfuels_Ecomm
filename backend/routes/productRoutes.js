import express from 'express';
import { getProducts, getProductById, triggerGoogleSync } from '../controllers/productController.js';
import { checkJwt, ensureUser } from '../middleware/auth.js';

const router = express.Router();

// Public routes for product catalog browsing
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected manual sync trigger
router.post('/sync', checkJwt, ensureUser, triggerGoogleSync);

export default router;
