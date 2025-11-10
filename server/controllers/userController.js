import Course from '../models/Course.js'
import {Purchase} from '../models/Purchase.js'
import User from '../models/User.js'
<<<<<<< HEAD
import Course from '../models/Course.js'
import { Purchase } from '../models/Purchase.js'
import Stripe from 'stripe'
import { CourseProgress } from '../models/CourseProgress.js'

// Get User Data
=======
import stripe from 'stripe'

>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
export const getUserData = async (req, res) => {

    try {
        const userId = req.auth().userId ? req.auth().userId : (typeof req.auth === 'function' ? req.auth().userId : undefined);
        const user = await User.findById(userId)
        if (!user) {
            return res.json({ success: false, message: 'User Not Found' })
        }
        res.json({ success: true, user })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//User Enrolled Courses
export const userEnrolledCourses = async (req, res) => {

    try {
        const userId = req.auth().userId ? req.auth().userId : (typeof req.auth === 'function' ? req.auth().userId : undefined);
        const userData = await User.findById(userId).populate('enrolledCourses')
        if (!userData) {
            return res.json({ success: false, message: 'User Not Found' })
        }
        res.json({ success: true, enrolledCourses: userData.enrolledCourses })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Purchase Course
export const purchaseCourse = async (req, res) => {

    try {
        const { courseId } = req.body
        const { origin } = req.headers
<<<<<<< HEAD

        const userId = req.auth.userId

=======
        const userId = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
        const courseData = await Course.findById(courseId)
        const userData = await User.findById(userId)
        if (!userData || !courseData) {
            return res.json({ success: false, message: 'Data Not Found' })
        }
<<<<<<< HEAD

        // compute numeric amount (with discount) and store as number
        const amountNumber = Number(
            (courseData.coursePrice - (courseData.discount * courseData.coursePrice) / 100).toFixed(2)
        )

=======
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: amountNumber,
        }
        const newPurchase = await Purchase.create(purchaseData)
        // Stripe Gateway Initialize
<<<<<<< HEAD
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

        const currency = (process.env.CURRENCY || 'usd').toLowerCase()

        // unit_amount must be integer cents
        const unit_amount = Math.round(amountNumber * 100)

        // Creating line items for Stripe
=======
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
        const currency = process.env.CURRENCY.toLocaleLowerCase()
        // Creating line items to for Stripe
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle
                },
                unit_amount
            },
            quantity: 1
        }]
        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: 'payment',
            payment_method_types: ['card'],
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        })
        res.json({ success: true, session_url: session.url });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

<<<<<<< HEAD
// Update User Course Progress
export const updateUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId, lectureId } = req.body;
        const processedData = await CourseProgress.findOne({ userId, courseId });

        if (processedData) {
            if (processedData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture already completed.' });
            }

            processedData.lectureCompleted.push(lectureId);
            await processedData.save();
        }
        else {
=======

export const updateUserCourseProgress = async (req, res) => {

    try {

        const userId = req.auth.userId

        const { courseId, lectureId } = req.body

        const progressData = await CourseProgress.findOne({ userId, courseId })

        if (progressData) {

            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture Already Completed' })
            }

            progressData.lectureCompleted.push(lectureId)
            await progressData.save()

        } else {

>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
<<<<<<< HEAD
            });
        }
        res.json({ success: true, message: 'Course progress updated successfully.' });
    
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Get User Course Progress
export const getUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.body;
        const progressData = await CourseProgress.findOne({ userId, courseId });
        res.json({ success: true, progressData });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Add user Rating to Course
export const addUserRating = async (req, res) => {
    const userId = req.auth.userId;
    const { courseId, rating } = req.body;

    if (!courseId || !rating || !userId || rating < 1 || rating > 5) {
        return res.json({ success: false, message: 'Invalid data provided.' });
    }

    try {
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.json({ success: false, message: 'Course not found.' });
        }
        
        const user = await User.findById(userId);

        if (!user || user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: 'User not enrolled in the course.' });
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId);

        if (existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating = rating;
        } else {
            course.courseRatings.push({ userId, rating });
        }
        await course.save();

        res.json({ success: true, message: 'Rating added successfully.' });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
=======
            })

        }

        res.json({ success: true, message: 'Progress Updated' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
export const getUserCourseProgress = async (req, res) => {

    try {

        const userId = req.auth.userId

        const { courseId } = req.body

        const progressData = await CourseProgress.findOne({ userId, courseId })

        res.json({ success: true, progressData })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

export const addUserRating = async (req, res) => {

    const userId = req.auth.userId;
    const { courseId, rating } = req.body;

    // Validate inputs
    if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
        return res.json({ success: false, message: 'InValid Details' });
    }

    try {
        // Find the course by ID
        const course = await Course.findById(courseId);

        if (!course) {
            return res.json({ success: false, message: 'Course not found.' });
        }

        const user = await User.findById(userId);

        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: 'User has not purchased this course.' });
        }

        // Check is user already rated
        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId);

        if (existingRatingIndex > -1) {
            // Update the existing rating
            course.courseRatings[existingRatingIndex].rating = rating;
        } else {
            // Add a new rating
            course.courseRatings.push({ userId, rating });
        }

        await course.save();

        return res.json({ success: true, message: 'Rating added' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
