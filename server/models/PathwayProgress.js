import mongoose from 'mongoose';

const pathwayProgressSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    pathwayId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'PathwayCourse' },
    completed: { type: Boolean, default: false },
    lectureCompleted: [{ type: String }], // Array of lectureIds (Note: Pathway lectureIds might need phase/chapter context if not unique globally, but assuming lecture objects have unique internal IDs or we use composite key)
    // Actually, lectures in pathways are just objects inside arrays. They might mostly define their own IDs or reuse from courses. 
    // To be safe, we might store `${phaseIndex}-${chapterIndex}-${lectureIndex}` or rely on the `lectureId` if it exists and is unique. 
    // Looking at PathwayCourse model, lectures have `lectureId` (required). We will use that.
    lastAccessedLecture: { type: String },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true, minimize: false });

pathwayProgressSchema.index({ userId: 1, pathwayId: 1 }, { unique: true });

export const PathwayProgress = mongoose.model('PathwayProgress', pathwayProgressSchema);
