// Package imports
import {Request, Response, NextFunction} from 'express';
import cloudinary from 'cloudinary';
// File imports
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import layoutModel from '../models/layout.model';

// Create Layout

export const createLayout = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {type} = req.body;
      const isTypeExist = await layoutModel.findOne({type});
      if (isTypeExist) {
        return next(new ErrorHandler(`Layout type ${type} already exist`, 400));
      }
      if (type === 'Banner') {
        const {image, title, subTitle} = req.body;
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: 'layout',
        });
        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        };
        await layoutModel.create(banner);
      }
      if (type === 'FAQ') {
        const {faq} = req.body;
        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          }),
        );
        await layoutModel.create({type: 'FAQ', faq: faqItems});
      }
      if (type === 'Categories') {
        const {categories} = req.body;
        const categoriesItems = await Promise.all(
          categories.map(async (item: any) => {
            return {
              title: item.title,
            };
          }),
        );
        await layoutModel.create({
          type: 'Categories',
          categories: categoriesItems,
        });
      }
      res.status(201).json({
        success: true,
        message: 'Layout created successfully',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
