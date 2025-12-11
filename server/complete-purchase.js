// Quick script to manually complete pending purchase and enroll user
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
};

const completePurchase = async (purchaseId) => {
    const Purchase = mongoose.model('Purchase', new mongoose.Schema({
        courseId: mongoose.Schema.Types.ObjectId,
        userId: String,
        amount: Number,
        status: String,
    }, { timestamps: true }));

    const User = mongoose.model('User', new mongoose.Schema({
        _id: String,
        enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    }));

    const Course = mongoose.model('Course', new mongoose.Schema({
        enrolledStudents: [String],
    }));

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
        console.log('Purchase not found');
        return;
    }

    console.log('Purchase found:', purchase);

    // Update purchase status
    purchase.status = 'completed';
    await purchase.save();
    console.log('Purchase status updated to completed');

    // Add user to course
    await Course.findByIdAndUpdate(purchase.courseId, {
        $addToSet: { enrolledStudents: purchase.userId }
    });
    console.log('User added to course enrolledStudents');

    // Add course to user (use string ID)
    await User.updateOne(
        { _id: purchase.userId },
        { $addToSet: { enrolledCourses: purchase.courseId } }
    );
    console.log('Course added to user enrolledCourses');

    console.log('✅ Enrollment completed successfully!');
};

// Run with: node complete-purchase.js <purchaseId>
const purchaseId = process.argv[2];
if (!purchaseId) {
    console.log('Usage: node complete-purchase.js <purchaseId>');
    process.exit(1);
}

connectDB()
    .then(() => completePurchase(purchaseId))
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
