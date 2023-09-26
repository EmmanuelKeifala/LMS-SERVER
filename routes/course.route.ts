/** @format */

import express from 'express';
import {
  addAnswer,
  addQuestion,
  addReview,
  courseUpload,
  editCourse,
  getAllCourses,
  getAllListedCourses,
  getCourseByUser,
  getSingleCourse,
  replyToReview,
} from '../controllers/course.controller';
import {authorizeRoles, isAuthenticated} from '../middleware/auth';
import {deleteCourse} from '../controllers/user.controller';
const courseRouter = express.Router();

// Create course
courseRouter.post(
  '/create-course',
  isAuthenticated,
  authorizeRoles('admin'),
  courseUpload,
);

// Edit Course
courseRouter.put(
  '/edit-course/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  editCourse,
);

// Get single course
courseRouter.get('/get-course/:id', getSingleCourse);

// Get all courses
courseRouter.get('/get-courses', getAllCourses);

// Get course based on user course List
courseRouter.get('/get-course-content/:id', isAuthenticated, getCourseByUser);

// Add questions to course
courseRouter.put('/add-questions', isAuthenticated, addQuestion);

// Adding question replies
courseRouter.put('/add-answer', isAuthenticated, addAnswer);

// Add reviews
courseRouter.put('/add-review', isAuthenticated, addReview);

// Reply to reviews
courseRouter.put(
  '/add-reply',
  isAuthenticated,
  authorizeRoles('admin'),
  replyToReview,
);

// get all courses for admin
courseRouter.get(
  '/get-all-courses',
  isAuthenticated,
  authorizeRoles('admin'),
  getAllListedCourses,
);

// Delete course
courseRouter.delete(
  '/delete-course/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  deleteCourse,
);
export default courseRouter;
