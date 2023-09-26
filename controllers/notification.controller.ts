// File imports
import notificationModel from '../models/notification.model';
import ErrorHandler from '../utils/ErrorHandler';
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';

// Module imports
import {Request, Response, NextFunction} from 'express';
import cron from 'node-cron';
// Get notifications for admin
export const getNotifications = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await notificationModel
        .find()
        .sort({createdAt: -1});
      if (!notifications) {
        return next(new ErrorHandler('No notifications yet', 404));
      }
      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// update notifications for admin
export const updateNotification = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await notificationModel.findById(req.params.id);
      if (!notification) {
        return next(new ErrorHandler('Notification not found', 404));
      } else {
        notification.status
          ? (notification.status = 'read')
          : notification.status;
      }

      await notification?.save();
      const notifications = await notificationModel
        .find()
        .sort({createdAt: -1});
      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Automatically delete outdated notifications
cron.schedule('0 0 0  * * *', async () => {
  const thirtyDayAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await notificationModel.deleteMany({
    status: 'read',
    createdAt: {$lt: thirtyDayAgo},
  });
});
