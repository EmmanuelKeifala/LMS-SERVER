/** @format */

// Package imports
import express from 'express';

// File Imports
import {
  registerUser,
  activateUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
  socialLogin,
  updateUserInfo,
  updateUserPassword,
  updateProfilePicture,
  getAllUsers,
  updateUserRole,
} from '../controllers/user.controller';
import {authorizeRoles, isAuthenticated} from '../middleware/auth';

const userRouter = express.Router();

// Routes
// Register user
userRouter.post('/register', registerUser);

// Activate user account
userRouter.post('/activate-user', activateUser);

// Login user
userRouter.post('/login-user', loginUser);

// Logout User
userRouter.get('/logout-user', isAuthenticated, logoutUser);

// Refresh
userRouter.get('/refresh-token', updateAccessToken);

// User Info (Me)
userRouter.get('/me', isAuthenticated, getUserInfo);

// Social logins
userRouter.post('/social-login', socialLogin);

// User Info Update
userRouter.put('/update-user', isAuthenticated, updateUserInfo);

// Update user password
userRouter.put('/update-password', isAuthenticated, updateUserPassword);

// Update user profile picture
userRouter.put(
  '/update-profile-picture',
  isAuthenticated,
  updateProfilePicture,
);

// get all users
userRouter.get(
  '/get-all-users',
  isAuthenticated,
  authorizeRoles('admin'),
  getAllUsers,
);

// Update user role -- only for admin
userRouter.put(
  '/update-user-role',
  isAuthenticated,
  authorizeRoles('admin'),
  updateUserRole,
);

// Update user role -- only for admin

export default userRouter;
