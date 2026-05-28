import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/requestValidator.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, registerValidator, registerUser);
router.post('/login', authLimiter, loginValidator, loginUser);
router.get('/profile', protect, getUserProfile);

export default router;
