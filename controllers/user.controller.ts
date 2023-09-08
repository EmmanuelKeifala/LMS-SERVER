/** @format */

// Package imports
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
require("dotenv").config();
import ejs from "ejs";
import path from "path";

// File Imports
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import sendEmail from "../utils/sendMail";

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
			const { name, email, password } = req.body;
			const isEmailExist = await userModel.findOne({ email });

			if (isEmailExist) {
				return next(new ErrorHandler("Email already exists", 400));
			}

			const user: IRegistrationBody = {
				name,
				email,
				password,
			};
			const activationToken = createActivationToken(user);
			const activationCode = activationToken.activationCode;

			const data = { user: { name: user.name }, activationCode };
			const html = await ejs.renderFile(
				path.join(__dirname, "../mails/activation-mail.ejs"),
				{ data }, // Pass the data object here
			);

			try {
				await sendEmail({
					email: user.email,
					subject: "Activate your account",
					template: "activation-mail.ejs",
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
		{ user, activationCode },
		process.env.ACTIVATION_SECRET!,
		{ expiresIn: "5m" },
	);

	return { token, activationCode };
};

// Activate user
interface IActivationRequest {
	activation_token: string;
	activation_code: string;
}

export const activateUser = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { activation_token, activation_code } =
				req.body as IActivationRequest;
			const newUser: { user: IUser; activationCode: string } = jwt.verify(
				activation_token,
				process.env.ACTIVATION_SECRET!,
			) as { user: IUser; activationCode: string };

			if (newUser.activationCode !== activation_code) {
				return next(new ErrorHandler("Invalid activation code", 400));
			}

			const { name, email, password } = newUser.user;
			const userExist = await userModel.findOne({ email });
			if (userExist) {
				return next(new ErrorHandler("User already exists", 400));
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
