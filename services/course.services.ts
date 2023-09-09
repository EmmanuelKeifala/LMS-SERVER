/** @format */
// Package Imports
import { NextFunction, Request, Response } from "express";

// File Imports
import courseModel from "../models/course.model";
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";

// Create a course
export const createCourse = CatchAsyncErrors(
	async (data: any, res: Response, next: NextFunction) => {
		const course = await courseModel.create(data);
		res.status(200).json({
			success: true,
			course,
		});
	},
);
