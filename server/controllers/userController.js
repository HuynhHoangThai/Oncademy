import Course from '../models/Course.js'
import {Purchase} from '../models/Purchase.js'
import User from '../models/User.js'
import {CourseProgress} from '../models/CourseProgress.js'
import stripe from 'stripe'
import { getUserId } from '../utils/authHelper.js'

export const getUserData = async (req, res) => {
    try {
        const userId = getUserId(req);
        
        if (!userId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }
        
        const user = await User.findById(userId);

        if (!user) {
            return res.json({ success: false, message: 'User Not Found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = getUserId(req);
        
        if (!userId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }
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
        const userId = getUserId(req);
        
        if (!userId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }
        
        if (!courseId) {
            return res.json({ success: false, message: 'Course ID is required' })
        }

        const courseData = await Course.findById(courseId)
        const userData = await User.findById(userId)
        
        if (!userData || !courseData) {
            return res.json({ success: false, message: 'Data Not Found' })
        }

        // Check if user is already enrolled in this course
        const isAlreadyEnrolled = courseData.enrolledStudents.some(
            studentId => studentId.toString() === userId
        );

        if (isAlreadyEnrolled) {
            return res.json({ 
                success: false, 
                message: 'You are already enrolled in this course',
                alreadyEnrolled: true
            });
        }

        // Check if there's a pending purchase for this course
        const existingPurchase = await Purchase.findOne({
            courseId: courseData._id,
            userId,
            status: { $in: ['pending', 'completed'] }
        });

        if (existingPurchase) {
            if (existingPurchase.status === 'completed') {
                return res.json({ 
                    success: false, 
                    message: 'You have already purchased this course',
                    alreadyEnrolled: true
                });
            }
            // If pending, allow creating new checkout session
            console.log('Found pending purchase, creating new checkout session');
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
        const userId = getUserId(req);
        
        if (!userId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }

        const { courseId, lectureId } = req.body;

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
        const userId = getUserId(req);
        
        if (!userId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }

        const { courseId } = req.body;

        const progressData = await CourseProgress.findOne({ userId, courseId })

        res.json({ success: true, progressData })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

export const addUserRating = async (req, res) => {
    try {
        const userId = getUserId(req);
        
        if (!userId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }
        
        const { courseId, rating } = req.body;

        // Validate inputs
        if (!courseId || !rating || rating < 1 || rating > 5) {
            return res.json({ success: false, message: 'Invalid Details' });
        }
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

export const getUserFavorites = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const user = await User.findById(userId).select('favoriteCourses');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.json({
            success: true,
            favorites: user.favoriteCourses || [] 
        });

    } catch (error) {
        console.error('Fetch Favorites Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

export const toggleFavoriteCourse = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { courseId } = req.body;

        if (!userId || !courseId) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        let updateAction;
        let message;

        const user = await User.findById(userId).select('favoriteCourses');
        const isFavorited = user.favoriteCourses.includes(courseId);

        if (isFavorited) {
            updateAction = { $pull: { favoriteCourses: courseId } };
            message = 'Course removed from favorites.';
        } else {
            updateAction = { $addToSet: { favoriteCourses: courseId } }; 
            message = 'Course added to favorites.';
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateAction,
            { new: true }
        ).select('favoriteCourses');

        return res.json({
            success: true,
            message: message,
            favorites: updatedUser.favoriteCourses 
        });

    } catch (error) {
        console.error('Toggle Favorite Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};