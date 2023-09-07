/** @format */

// Package imports
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
require("dotenv").config();
import cookieParser from "cookie-parser";

// File Imports
import { ErrorMiddleware } from "./middleware/error";

export const app = express();

// Body parser
app.use(express.json({ limit: "50mb" }));

// Cookie parser
app.use(cookieParser());

// Cors <=> protecting our apis by origins
app.use(
	cors({
		origin: process.env.ORIGIN,
	}),
);

// Testing the API
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json({
		success: true,
		message: "APi is working",
	});
});

// Unknow api route request
app.all("*", (req: Request, res: Response, next: NextFunction) => {
	const error = new Error(`Route ${req.originalUrl} not found`) as any;

	error.statusCode = 404;
	next(error);
});

// Handle errors
app.use(ErrorMiddleware);
