import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { checkJwt, ensureUser } from '../middleware/auth.js';

const router = express.Router();

// Apply auth globally to all wishlist endpoints
router.use(checkJwt, ensureUser);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:product_id', removeFromWishlist);

export default router;
