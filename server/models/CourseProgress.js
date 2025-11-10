<<<<<<< HEAD
import mongoose from "mongoose";
=======
import mongoose from 'mongoose';
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2

const courseProgressSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    completed: { type: Boolean, default: false },
<<<<<<< HEAD
    lectureCompleted: []

    // add timestamp later
}, { minnimize: false });

export const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);
=======
    lectureCompleted: [

    ]
}, { minimize: false });

export const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
