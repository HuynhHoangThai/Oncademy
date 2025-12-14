import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema({
    lectureId: { type: String, required: true },
    lectureTitle: { type: String, required: true },
    lectureDuration: { type: Number, required: true },
    lectureUrl: { type: String, required: true },
    isPreviewFree: { type: Boolean, required: true },
    lectureOrder: { type: Number, required: true }
}, { _id: false }); 

const chapterSchema = new mongoose.Schema({
    chapterId: { type: String, required: true },
    chapterOrder: { type: Number, required: true },
    chapterTitle: { type: String, required: true },
    chapterContent: [lectureSchema] // Use the lecture schema here
}, { _id: false });

const courseSchema = new mongoose.Schema({
    courseTitle: { type: String, required: true },
    courseDescription: { type: String, required: true },
    courseThumbnail: { type: String },
    coursePrice: { type: Number, required: true },
    isPublished: { type: Boolean, default: false },
    discount: { type: Number, required: true, min: 0, max: 100 },
    courseContent: [chapterSchema], // Use the chapter schema here
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
courseSchema.index({ isPublished: 1, createdAt: -1 });
courseSchema.index({ educator: 1 });
courseSchema.index({ 'courseRatings.userId': 1 });
courseSchema.index({ enrolledStudents: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;