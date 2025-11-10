import Course from '../models/Course.js'
import {Purchase} from '../models/Purchase.js'
import User from '../models/User.js'
import {CourseProgress} from '../models/CourseProgress.js'
import stripe from 'stripe'

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
export const userEnrolledCourses = async (req, res) => {

    try {
        const userId = req.auth().userId ? req.auth().userId : (typeof req.auth === 'function' ? req.auth().userId : undefined);
        const userData = await User.findById(userId).populate('enrolledCourses')
        if (!userData) {
            return res.json({ success: false, message: 'User Not Found' })
        }

        // Get progress data for all enrolled courses
        const courseIds = userData.enrolledCourses.map(course => course._id)
        const progressData = await CourseProgress.find({ 
            userId, 
            courseId: { $in: courseIds } 
        })

        // Create a map of courseId -> progress for easy lookup
        const progressMap = {}
        progressData.forEach(progress => {
            progressMap[progress.courseId.toString()] = {
                progressPercentage: progress.progressPercentage,
                completed: progress.completed,
                lecturesCompleted: progress.lectureCompleted.length,
                lastAccessedLecture: progress.lastAccessedLecture
            }
        })

        // Attach progress to each course
        const coursesWithProgress = userData.enrolledCourses.map(course => ({
            ...course.toObject(),
            progress: progressMap[course._id.toString()] || {
                progressPercentage: 0,
                completed: false,
                lecturesCompleted: 0,
                lastAccessedLecture: null
            }
        }))

        res.json({ success: true, enrolledCourses: coursesWithProgress })
    } catch (error) {
        console.error('Get enrolled courses error:', error)
        res.json({ success: false, message: error.message })
    }

}
export const purchaseCourse = async (req, res) => {

    try {
        const { courseId } = req.body
        const { origin } = req.headers
        const userId = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId
        
        if (!courseId) {
            return res.json({ success: false, message: 'Course ID is required' })
        }

        const courseData = await Course.findById(courseId)
        const userData = await User.findById(userId)
        
        if (!userData || !courseData) {
            return res.json({ success: false, message: 'Data Not Found' })
        }

        const amount = Number((courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2))
        
        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount
        }
        
        const newPurchase = await Purchase.create(purchaseData)
        
        // Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
        const currency = (process.env.CURRENCY || 'usd').toLowerCase()
        
        // Creating line items to for Stripe
        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle
                },
                unit_amount: Math.round(amount * 100) // Stripe expects amount in cents
            },
            quantity: 1
        }]
        
        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        })
        
        res.json({ success: true, sessionUrl: session.url });
    } catch (error) {
        console.error('Purchase error:', error);
        res.json({ success: false, message: error.message });
    }
}


export const updateUserCourseProgress = async (req, res) => {

    try {

        const userId = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId

        const { courseId, lectureId } = req.body

        if (!courseId || !lectureId) {
            return res.json({ success: false, message: 'Course ID and Lecture ID are required' })
        }

        // Get course data to calculate total lectures
        const courseData = await Course.findById(courseId)
        if (!courseData) {
            return res.json({ success: false, message: 'Course not found' })
        }

        // Calculate total lectures in the course
        let totalLectures = 0
        courseData.courseContent.forEach(chapter => {
            totalLectures += chapter.chapterContent.length
        })

        let progressData = await CourseProgress.findOne({ userId, courseId })

        if (progressData) {

            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture Already Completed', progress: progressData })
            }

            progressData.lectureCompleted.push(lectureId)
            progressData.lastAccessedLecture = lectureId
            
            // Calculate progress percentage
            const completedCount = progressData.lectureCompleted.length
            progressData.progressPercentage = Math.round((completedCount / totalLectures) * 100)
            
            // Mark course as completed if all lectures are done
            if (completedCount >= totalLectures) {
                progressData.completed = true
            }
            
            await progressData.save()

        } else {

            const completedCount = 1
            const progressPercentage = Math.round((completedCount / totalLectures) * 100)
            
            progressData = await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId],
                lastAccessedLecture: lectureId,
                progressPercentage,
                completed: completedCount >= totalLectures
            })

        }

        res.json({ success: true, message: 'Progress Updated', progress: progressData })

    } catch (error) {
        console.error('Update progress error:', error)
        res.json({ success: false, message: error.message })
    }
}
export const getUserCourseProgress = async (req, res) => {

    try {

        const userId = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId

        const { courseId } = req.body

        const progressData = await CourseProgress.findOne({ userId, courseId })

        res.json({ success: true, progressData })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

export const addUserRating = async (req, res) => {

    const userId = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId;
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