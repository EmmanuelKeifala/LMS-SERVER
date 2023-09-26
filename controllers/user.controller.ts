/** @format */

// Package imports
import {Request, Response, NextFunction} from 'express';
import jwt, {JwtPayload} from 'jsonwebtoken';
require('dotenv').config();
import ejs from 'ejs';
import path from 'path';
import cloudinary from 'cloudinary';

// File Imports
import userModel, {IUser} from '../models/user.model';
import ErrorHandler from '../utils/ErrorHandler';
import {CatchAsyncErrors} from '../middleware/catchAsyncErrors';
import sendEmail from '../utils/sendMail';
import {sendToken, accessTokenOptions, refreshTokenOptions} from '../utils/jwt';
import {redis} from '../utils/redis';
import {
  getAllUserService,
  getUserById,
  updateUserRoleService,
} from '../services/service';

// Register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {name, email, password} = req.body as IRegistrationBody;
      const isEmailExist = await userModel.findOne({email});

      if (isEmailExist) {
        return next(new ErrorHandler('Email already exists', 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };
      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;

      const data = {user: {name: user.name}, activationCode};
      const html = await ejs.renderFile(
        path.join(__dirname, '../mails/activation-mail.ejs'),
        {data}, // Pass the data object here
      );

      try {
        await sendEmail({
          email: user.email,
          subject: 'Activate your account',
          template: 'activation-mail.ejs',
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email ${user.email} to activate your account`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {user, activationCode},
    process.env.ACTIVATION_SECRET!,
    {expiresIn: '5m'},
  );

  return {token, activationCode};
};

// Activate user
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {activation_token, activation_code} =
        req.body as IActivationRequest;
      const newUser: {user: IUser; activationCode: string} = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET!,
      ) as {user: IUser; activationCode: string};

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler('Invalid activation code', 400));
      }

      const {name, email, password} = newUser.user;
      const userExist = await userModel.findOne({email});
      if (userExist) {
        return next(new ErrorHandler('User already exists', 400));
      }

      const user = await userModel.create({
        name,
        email,
        password,
      });
      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Login user
interface ILoginBody {
  email: string;
  password: string;
}
export const loginUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {email, password} = req.body as ILoginBody;

      if (!email || !password) {
        return next(new ErrorHandler('Please provide email and password', 400));
      }

      const user = await userModel.findOne({email}).select('+password');
      if (!user) {
        return next(new ErrorHandler('Invalid credentials', 400));
      }
      const isPasswordMatched = await user.comparePassword(password);
      if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid credentials', 400));
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Logout user
export const logoutUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('access_token', '', {
        maxAge: 1,
      });
      res.cookie('refresh_token', '', {
        maxAge: 1,
      });
      const userId = req.user?._id || '';
      redis.del(userId);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Update access token
export const updateAccessToken = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN! as string,
      ) as JwtPayload;

      const message = 'Access token updated was unsuccessfully';
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }
      const session = await redis.get(decoded.id as string);

      if (!session) {
        return next(new ErrorHandler(message, 400));
      }
      // req.user = JSON.parse(user);
      const user = JSON.parse(session);
      const accessToken = jwt.sign(
        {id: user._id},
        process.env.ACCESS_TOKEN! as string,
        {expiresIn: '5m'},
      );

      const refreshToken = jwt.sign(
        {id: user._id},
        process.env.REFRESH_TOKEN! as string,
        {expiresIn: '5m'},
      );
      req.user = user;
      res.cookie('access_token', accessToken, accessTokenOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenOptions);

      res.status(200).json({
        success: 'success',
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Get user Info
export const getUserInfo = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Social Logins
interface ISocialLoginBody {
  email: string;
  name: string;
  avatar: string;
}
export const socialLogin = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {email, name, avatar} = req.body as ISocialLoginBody;
      const user = await userModel.findOne({email});
      if (!user) {
        const newUser = await userModel.create({
          email,
          name,
          avatar,
        });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Update user Info
interface IUpdateUserInfo {
  name?: string;
  email?: string;
}
export const updateUserInfo = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {name, email} = req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);
      if (email && user) {
        const isEmailExisiting = await userModel.findOne({email});
        if (isEmailExisiting) {
          return next(new ErrorHandler('Email already exists', 400));
        }
        user.email = email;
        await user.save();
      }
      if (name && user) {
        user.name = name;
        await user.save();
      }

      await redis.set(userId, JSON.stringify(user));

      res.status(201).json({
        success: true,
        message: 'User info updated successfully',
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Update user password
interface IUpdateUserPassword {
  oldPassword: string;
  newPassword: string;
}
export const updateUserPassword = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {oldPassword, newPassword} = req.body as IUpdateUserPassword;

      if (!oldPassword || !newPassword) {
        return next(
          new ErrorHandler('Please provide old and new password', 400),
        );
      }
      if (oldPassword === newPassword) {
        return next(
          new ErrorHandler('New password cannot be same as old password', 400),
        );
      }
      const user = await userModel.findById(req.user?._id).select('+password');

      if (user?.password === undefined) {
        return next(new ErrorHandler('User password is undefined', 400));
      }
      const isPasswordMatched = await user?.comparePassword(oldPassword);
      if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid old password', 400));
      }
      user.password = newPassword;
      await user.save();
      await redis.set(req.user?._id, JSON.stringify(user));
      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Update profile picture
interface IUpdateProfilePicture {
  avatar: string;
}
export const updateProfilePicture = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {avatar} = req.body as IUpdateProfilePicture;
      const user = await userModel.findById(req.user?._id);
      if (avatar && user) {
        if (user?.avatar.public_id) {
          await cloudinary.v2.uploader.destroy(user?.avatar.public_id);
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }
      await user?.save();

      await redis.set(req.user?._id, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// get all users -- only for admin
export const getAllUsers = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUserService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// update user role -- only for admin
export const updateUserRole = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {id, role} = req.body;
      const user = await userModel.findById(id);
      updateUserRoleService(res, id, role);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);
