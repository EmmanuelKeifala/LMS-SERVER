/** @format */
// Package Imports
import {NextFunction, Response, Request} from 'express';
import path from 'path';
import ejs from 'ejs';

// File Imports
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import orderModel, {IOrder} from '../models/order.model';
import userModel, {IUser} from '../models/user.model';
import courseModel from '../models/course.model';
import sendEmail from '../utils/sendMail';
import notificationModel from '../models/notification.model';
import {createNewOrder} from '../services/order.services';

// Create oder
export const createOrder = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {courseId, payment_info}: IOrder = req.body;
      const user = await userModel.findById(req.user?._id);
      const courseExistsForUser = user?.courses.some(
        (course: any) => course._id.toString() === courseId,
      );
      if (courseExistsForUser) {
        return next(
          new ErrorHandler('You have already purchased this course', 400),
        );
      }
      const course = await courseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }
      const orderData: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info,
      };

      const data = {
        order: {
          _id: course._id.toString().slice(0, 6),
        },
        userName: user?.name,
        name: course.name,
        price: course.price,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        email: user?.email,
      };

      const html = await ejs.renderFile(
        path.join(__dirname, '../mails/order-confirmation.ejs'),
        {data},
      );
      try {
        if (user) {
          await sendEmail({
            email: user?.email,
            subject: 'Order Confirmation',
            template: 'order-confirmation.ejs',
            data,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      // Add course to user
      user?.courses.push(course._id);
      await user?.save();
      await notificationModel.create({
        user: user?._id,
        title: 'New Order',
        message: `You have a new order from ${user?.name}`,
      });

      if (course.purchased) {
        course.purchased ? (course.purchased += 1) : course.purchased;
      }
      await course?.save();
      createNewOrder(orderData, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
