import express from 'express';
import { getAddresses, addAddress } from '../controllers/addressController.js';
import { checkJwt, ensureUser } from '../middleware/auth.js';

const router = express.Router();

router.use(checkJwt, ensureUser);

router.get('/', getAddresses);
router.post('/', addAddress);

export default router;
