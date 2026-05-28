import express from 'express';
import { 
  getDashboardAnalytics, 
  getUrlAnalytics, 
  getPublicUrlAnalytics, 
  exportUrlAnalyticsCSV,
  getPredictiveAnalytics
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardAnalytics);
router.get('/url/:id', protect, getUrlAnalytics);
router.get('/predict/:id', protect, getPredictiveAnalytics);
router.get('/public/:shortCode', getPublicUrlAnalytics);
router.get('/export/:id', protect, exportUrlAnalyticsCSV);

export default router;
