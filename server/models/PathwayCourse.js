import mongoose from 'mongoose';

// Lecture schema (reused from Course model)
const lectureSchema = new mongoose.Schema({
    lectureId: { type: String, required: true },
    lectureTitle: { type: String, required: true },
    lectureDuration: { type: Number, required: true },
    lectureUrl: { type: String, required: true },
    isPreviewFree: { type: Boolean, required: true },
    lectureOrder: { type: Number, required: true }
}, { _id: false });

// Chapter schema (reused from Course model)
const chapterSchema = new mongoose.Schema({
    chapterId: { type: String, required: true },
    chapterOrder: { type: Number, required: true },
    chapterTitle: { type: String, required: true },
    chapterContent: [lectureSchema]
}, { _id: false });

// Phase schema (contains chapters like a full course)
const phaseSchema = new mongoose.Schema({
    phaseId: { type: String, required: true },
    phaseOrder: { type: Number, required: true },
    phaseTitle: { type: String, required: true },
    chapters: [chapterSchema] // Each phase is like a full course
}, { _id: false });

const pathwayCourseSchema = new mongoose.Schema({
    pathwayTitle: { type: String, required: true },
    pathwayDescription: { type: String, required: true },
    pathwayThumbnail: { type: String },
    pathwayPrice: { type: Number, required: true },
    isPublished: { type: Boolean, default: false },
    discount: { type: Number, required: true, min: 0, max: 100 },
    phases: [phaseSchema], // Array of phases, each with chapters and lectures
    educator: {
        type: String,
        ref: 'User',
        required: true
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        required: true
    },
    rejectionReason: {
        type: String,
        required: false
    },
    approvedBy: {
        type: String,
        required: false
    },
    courseRatings: [
        {
            userId: { type: String },
            rating: { type: Number, min: 1, max: 5 }
        }
    ],
    enrolledStudents: [
        {
            type: String,
            ref: 'User'
        }
    ],
}, { timestamps: true, minimize: false });

// Add indexes for better query performance
pathwayCourseSchema.index({ isPublished: 1, createdAt: -1 });
pathwayCourseSchema.index({ educator: 1 });
pathwayCourseSchema.index({ 'courseRatings.userId': 1 });
pathwayCourseSchema.index({ enrolledStudents: 1 });

const PathwayCourse = mongoose.model('PathwayCourse', pathwayCourseSchema);

export default PathwayCourse;
