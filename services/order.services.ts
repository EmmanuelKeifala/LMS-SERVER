/** @format */
// Package Imports
import {NextFunction, Response} from 'express';

// File Imports
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';
import orderModel from '../models/order.model';
// Create new order
export const createNewOrder = CatchAsyncErrors(
  async (orderData: any, res: Response, next: NextFunction) => {
    const order = await orderModel.create(orderData);
    res.status(201).json({
      success: true,
      order,
    });
  },
);

// get all orders
export const getAllOrdersService = async (res: Response) => {
  const orders = await orderModel.find().sort({createdAt: -1});

  res.status(200).json({
    success: true,
    orders,
  });
};
