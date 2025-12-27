import mongoose from "mongoose";

const PurchaseSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: function () { return !this.pathwayId; }
    },
    pathwayId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PathwayCourse',
        required: function () { return !this.courseId; }
    },
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }

}, { timestamps: true });

export const Purchase = mongoose.model('Purchase', PurchaseSchema);