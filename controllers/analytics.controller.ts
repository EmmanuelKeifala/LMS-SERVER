// Package import
import {Request, Response, NextFunction} from 'express';

// File imports
import ErrorHandler from '../utils/ErrorHandler';
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';
import {generateLast12MonthData} from '../utils/analytics.genertor';
import userModel from '../models/user.model';
import orderModel from '../models/order.model';
import courseModel from '../models/course.model';

// get user analytics for admin
export const getUserAnalytics = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthData(userModel);
      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Get order analytics for admin
export const getOrderAnalytics = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthData(orderModel);
      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Get courses analytics for admin
export const getCourseAnalytics = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthData(courseModel);
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
