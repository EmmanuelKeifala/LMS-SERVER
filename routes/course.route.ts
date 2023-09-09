/** @format */

import express from "express";
import {
	addQuestion,
	courseUpload,
	editCourse,
	getAllCourses,
	getCourseByUser,
	getSingleCourse,
} from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const courseRouter = express.Router();

// Create course
courseRouter.post(
	"/create-course",
	isAuthenticated,
	authorizeRoles("admin"),
	courseUpload,
);

// Edit Course
courseRouter.put(
	"/edit-course/:id",
	isAuthenticated,
	authorizeRoles("admin"),
	editCourse,
);

// Get single course
courseRouter.get("/get-course/:id", getSingleCourse);

// Get all courses
courseRouter.get("/get-courses", getAllCourses);

// Get course based on user course List
courseRouter.get("/get-course-content/:id", isAuthenticated, getCourseByUser);

// Add questions to course
courseRouter.put("/add-questions", isAuthenticated, addQuestion);
export default courseRouter;
