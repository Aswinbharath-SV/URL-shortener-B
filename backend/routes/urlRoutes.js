import express from 'express';
import { createShortUrl, getMyUrls, updateUrl, deleteUrl, bulkUploadUrls, getAiAliasSuggestions } from '../controllers/urlController.js';
import { urlValidator } from '../validators/requestValidator.js';
import { protect } from '../middleware/authMiddleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to url generation APIs
router.get('/ai-suggest', protect, getAiAliasSuggestions);
router.post('/', protect, apiLimiter, urlValidator, createShortUrl);
router.get('/', protect, getMyUrls);
router.put('/:id', protect, updateUrl);
router.delete('/:id', protect, deleteUrl);
router.post('/bulk', protect, apiLimiter, bulkUploadUrls);

export default router;
