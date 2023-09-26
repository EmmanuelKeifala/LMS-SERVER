import express from 'express';
import {authorizeRoles, isAuthenticated} from '../middleware/auth';
import {
  getCourseAnalytics,
  getOrderAnalytics,
  getUserAnalytics,
} from '../controllers/analytics.controller';

const analyticsRouter = express.Router();
// user analytics data
analyticsRouter.get(
  '/get-user-analytics',
  isAuthenticated,
  authorizeRoles('admin'),
  getUserAnalytics,
);

// order analytics data
analyticsRouter.get(
  '/get-order-analytics',
  isAuthenticated,
  authorizeRoles('admin'),
  getOrderAnalytics,
);
// order analytics data
analyticsRouter.get(
  '/get-course-analytics',
  isAuthenticated,
  authorizeRoles('admin'),
  getCourseAnalytics,
);
export default analyticsRouter;
