/** @format */

// Package imports
import express from "express";

// File Imports
import { registerUser, activateUser } from "../controllers/user.controller";

const userRouter = express.Router();

// Routes
userRouter.post("/register", registerUser);
userRouter.post("/activate-user", activateUser);
export default userRouter;
