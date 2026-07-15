import express from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem, mergeCart } from '../controllers/cartController.js';
import { checkJwt, ensureUser } from '../middleware/auth.js';

const router = express.Router();

// Apply auth authentication globally to all cart endpoints
router.use(checkJwt, ensureUser);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/merge', mergeCart);
router.put('/:product_id', updateCartItem);
router.delete('/:product_id', removeCartItem);

export default router;
