import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    imageUrl: { type: String, required: true },
    enrolledCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
    enrolledPathways: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PathwayCourse'
        }
    ],
    createdCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
    role: {
        type: String,
        enum: ['student', 'educator', 'admin'],
        default: 'student'
    },
    applicationStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    resume: {
        type: String,
        default: null
    },
    favoriteCourses: [{
        type: String,
        required: false
    }],
    favoritePathways: [{
        type: String,
        required: false
    }],
    rejectionReason: {
        type: String,
        default: ''
    },
    isAccountBanned: {
        type: Boolean,
        default: false
    },
    banReason: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User