/** @format */

import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "./user.model";

interface IComment extends Document {
	question: string;
	questionReplies: IComment[];
	user: IUser;
}
interface IReview extends Document {
	rating: number;
	comment: string;
	user: IUser;
	commentReplies: IComment[];
}

interface ILink extends Document {
	title: string;
	url: string;
}

interface ICourseData extends Document {
	title: string;
	description: string;
	videoUrl: string;
	videoThumbnail: object;
	videoSection: string;
	videoDuration: number;
	videoPlayer: string;
	links: ILink[];
	suggestion: string;
	questions: IComment[];
}
interface ICourse extends Document {
	name: string;
	description: string;
	price: number;
	demoUrl: string;
	estimatedPrice?: number;
	thumbnail: object;
	tags: string;
	level: string;
	benefits: { title: string }[];
	prerequisites: { title: string }[];
	reviews: IReview[];
	courseData: ICourseData[];
	ratings?: number;
	purchased?: number;
}

// Model creation
const reviewSchema = new Schema<IReview>({
	user: Object,
	rating: {
		type: Number,
		default: 0,
	},
	comment: String,
});
const linkSchema = new Schema<ILink>({
	title: String,
	url: String,
});
const commentSchema = new Schema<IComment>({
	user: Object,
	question: String,
	questionReplies: [Object],
});
const courseDataSchema = new Schema<ICourseData>({
	videoUrl: String,
	// videoThumbnail: Object,
	title: String,

	videoSection: String,
	description: String,
	videoDuration: Number,
	videoPlayer: String,
	links: [linkSchema],
	suggestion: String,
	questions: [commentSchema],
});

const courseSchema = new Schema<ICourse>({
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	estimatedPrice: {
		type: Number,
	},
	thumbnail: {
		public_id: {
			// required: true,
			type: String,
		},
		url: {
			type: String,
			// required: true,
		},
	},
	tags: {
		type: String,
		required: true,
	},
	level: {
		type: String,
		required: true,
	},
	demoUrl: {
		type: String,
		required: true,
	},
	benefits: [{ title: String }],
	prerequisites: [{ title: String }],
	reviews: [reviewSchema],
	courseData: [courseDataSchema],
	ratings: {
		type: Number,
		default: 0,
	},
	purchased: {
		type: Number,
		default: 0,
	},
});

const courseModel: Model<ICourse> = mongoose.model("course", courseSchema);
export default courseModel;
