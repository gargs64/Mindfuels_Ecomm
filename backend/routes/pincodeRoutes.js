import express from 'express';
import { lookupPincode } from '../controllers/pincodeController.js';

const router = express.Router();

// Public endpoint for checkout form auto-fill
router.get('/:pincode', lookupPincode);

export default router;
