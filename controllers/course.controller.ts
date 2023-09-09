/** @format */
// Package Imports
import { NextFunction, Response, Request } from "express";
import cloudinary from "cloudinary";

// File Imports
import { CatchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { createCourse } from "../services/course.services";
import courseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";

// The course upload function
export const courseUpload = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;
			const thumbnail = data.thumbnail;
			if (thumbnail) {
				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: "course",
					width: 300,
					crop: "scale",
				});

				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}
			createCourse(data, res, next);
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	},
);

// Edit course
export const editCourse = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const data = req.body;
			const thumbnail = data.thumbnail;
			if (thumbnail) {
				await cloudinary.v2.uploader.destroy(thumbnail.public_id);
				const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
					folder: "course",
					width: 300,
					crop: "scale",
				});

				data.thumbnail = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url,
				};
			}

			const courseId = req.params.id;
			const course = await courseModel.findByIdAndUpdate(
				courseId,
				{
					$set: data,
				},
				{ new: true },
			);
			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	},
);

// Get single course without purchase
export const getSingleCourse = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const courseId = req.params.id;
			const doesCacheExist = await redis.get(courseId);
			if (doesCacheExist) {
				return res.status(200).json({
					success: true,
					course: JSON.parse(doesCacheExist),
				});
			} else {
				const course = await courseModel
					.findById(courseId)
					.select(
						"-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links",
					);
				await redis.set(courseId, JSON.stringify(course));
				res.status(200).json({
					success: true,
					course,
				});
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	},
);

// Get all courses
export const getAllCourses = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const doesCacheExist = await redis.get("allCourses");
			if (doesCacheExist) {
				return res.status(200).json({
					success: true,
					courses: JSON.parse(doesCacheExist),
				});
			} else {
				const courses = await courseModel
					.find()
					.select(
						"-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links",
					);
				res.status(200).json({
					success: true,
					courses,
				});
			}
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	},
);

// Get courses only for valid users
export const getCourseByUser = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userCourseList = req.user?.courses;
			const courseId = req.params.id;
			const courseExits = userCourseList?.find(
				(course: any) => course._id.toString() === courseId,
			);
			if (!courseExits) {
				return next(new ErrorHandler("Course not found", 404));
			}
			const course = await courseModel.findById(courseId);
			const content = course?.courseData;
			res.status(200).json({
				success: true,
				content,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	},
);

// Add question in the course
interface IQuestionData {
	question: string;
	courseId: string;
	contentId: string;
}

export const addQuestion = CatchAsyncErrors(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { question, courseId, contentId }: IQuestionData = req.body;
			const course = await courseModel.findById(courseId);
			if (!course) {
				return next(new ErrorHandler("Course not found", 404));
			}
			if (!mongoose.Types.ObjectId.isValid(contentId)) {
				return next(new ErrorHandler("Invalid content id", 400));
			}
			const courseContent = course?.courseData.find((item: any) =>
				item._id.equals(contentId),
			);
			if (!courseContent) {
				return next(new ErrorHandler("Content not found", 404));
			}

			// Create question
			const newQuestion: any = {
				user: req.user,
				question,
				questionReplies: [],
			};

			// Add the question to the course content
			courseContent.questions.push(newQuestion);

			// save
			await course?.save();

			res.status(200).json({
				success: true,
				course,
			});
		} catch (error: any) {
			return next(new ErrorHandler(error.message, 500));
		}
	},
);

// Adding an answer to a question in the course
interface IAnswerData {
	answer: string;
	courseId: string;
	contentId: string;
	questionId: string;
}
