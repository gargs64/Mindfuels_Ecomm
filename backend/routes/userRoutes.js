import express from 'express';
import { syncProfile, getProfile } from '../controllers/userController.js';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(checkJwt, ensureUser);

router.post('/sync', authLimiter, syncProfile);
router.get('/profile', getProfile);

export default router;
