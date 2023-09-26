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

// Edit layout
export const editLayout = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {type} = req.body;
      if (type === 'Banner') {
        const bannerData: any = await layoutModel.findOne({type: 'Banner'});
        const {image, title, subTitle} = req.body;
        if (bannerData) {
          await cloudinary.v2.uploader.destroy(bannerData.image.public_id);
        }
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
        await layoutModel.findByIdAndUpdate(bannerData.id, {banner});
      }
      if (type === 'FAQ') {
        const {faq} = req.body;
        const FaqItems = await layoutModel.findOne({type: 'FAQ'});
        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          }),
        );
        await layoutModel.findByIdAndUpdate(FaqItems?._id, {
          type: 'FAQ',
          faq: faqItems,
        });
      }
      if (type === 'Categories') {
        const {categories} = req.body;
        const Categories = await layoutModel.findOne({type: 'Categories'});
        const categoriesItems = await Promise.all(
          categories.map(async (item: any) => {
            return {
              title: item.title,
            };
          }),
        );
        await layoutModel.findByIdAndUpdate(Categories?._id, {
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

// Get layout by type
export const getLayoutByType = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const layout = await layoutModel.findOne(req.body.type);
      res.status(200).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
