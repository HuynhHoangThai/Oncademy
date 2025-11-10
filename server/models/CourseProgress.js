import mongoose from 'mongoose';

const courseProgressSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    courseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Course' },
    completed: { type: Boolean, default: false },
    lectureCompleted: [{ type: String }], // Array of lectureIds
    lastAccessedLecture: { type: String }, // Last lecture ID accessed
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true, minimize: false });

// Create compound index for faster queries and uniqueness
// Note: This compound index also creates an index on userId (prefix)
// If you see duplicate index warning, it means database has old single userId index
// Run: db.courseprogresses.dropIndex("userId_1") in MongoDB to remove old index
courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);
