import { clerkClient } from '@clerk/express'
import Course from '../models/Course.js'
import { Purchase } from '../models/Purchase.js'
import User from '../models/User.js'
import { v2 as cloudinary } from 'cloudinary'
import { getEducatorDashboard, syncEducatorDashboard } from '../utils/dashboardHelper.js'
export const updateRoleToEducator = async (req, res) => {

    try {

    const userId = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            },
        })

        res.json({ success: true, message: 'You can publish a course now' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

export const addCourse = async (req, res) => {

    try {

        const { courseData } = req.body

    const imageFile = req.file

    const educatorId = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId

        if (!imageFile) {
            return res.json({ success: false, message: 'Thumbnail Not Attached' })
        }

        const parsedCourseData = await JSON.parse(courseData)

        parsedCourseData.educator = educatorId

        const newCourse = await Course.create(parsedCourseData)

        // Upload from buffer (memory) instead of file path
        // Convert buffer to base64 data URI
        const b64 = Buffer.from(imageFile.buffer).toString('base64')
        const dataURI = `data:${imageFile.mimetype};base64,${b64}`
        
        const imageUpload = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'auto'
        })

        newCourse.courseThumbnail = imageUpload.secure_url

        await newCourse.save()

        // Sync dashboard after adding new course
        await syncEducatorDashboard(educatorId).catch(err => {
            console.error('Dashboard sync error:', err);
        });

        res.json({ success: true, message: 'Course Added' })

    } catch (error) {

        res.json({ success: false, message: error.message })

    }
}

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
    try {
        const educator = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId

        const courses = await Course.find({ educator })

        // Add quiz count to each course
        const { default: Quiz } = await import('../models/Quiz.js');
        const coursesWithQuizCount = await Promise.all(
            courses.map(async (course) => {
                const quizCount = await Quiz.countDocuments({ courseId: course._id });
                return {
                    ...course.toObject(),
                    quizCount
                };
            })
        );

        res.json({ success: true, courses: coursesWithQuizCount })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const educatorDashboardData = async (req, res) => {
    try {
        const educator = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId;

        // Fetch from Dashboard model (which inherits data from Course, Purchase, User tables)
        const dashboard = await getEducatorDashboard(educator);

        if (!dashboard) {
            // If no dashboard, sync and create one
            const newDashboard = await syncEducatorDashboard(educator);
            return res.json({
                success: true,
                dashboardData: newDashboard || {
                    totalEarnings: 0,
                    totalEnrollments: 0,
                    totalCourses: 0,
                    totalPurchases: 0,
                    recentEnrollments: [],
                    courseStats: [],
                    topCourses: [],
                    monthlyEarnings: [],
                    enrolledStudents: []
                }
            });
        }

        res.json({
            success: true,
            dashboardData: {
                totalEarnings: dashboard.totalEarnings || 0,
                totalEnrollments: dashboard.totalEnrollments || 0,
                totalCourses: dashboard.totalCourses || 0,
                totalPurchases: dashboard.totalPurchases || 0,
                recentEnrollments: dashboard.recentEnrollments || [],
                courseStats: dashboard.courseStats || [],
                topCourses: dashboard.topCourses || [],
                monthlyEarnings: dashboard.monthlyEarnings || [],
                enrolledStudents: dashboard.enrolledStudents || []
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Force sync dashboard data
export const forceSyncDashboard = async (req, res) => {
    try {
        const educator = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId;

        const dashboard = await syncEducatorDashboard(educator);

        res.json({
            success: true,
            message: 'Dashboard synced successfully',
            dashboardData: {
                totalEarnings: dashboard.totalEarnings || 0,
                totalEnrollments: dashboard.totalEnrollments || 0,
                totalCourses: dashboard.totalCourses || 0,
                totalPurchases: dashboard.totalPurchases || 0,
                recentEnrollments: dashboard.recentEnrollments || [],
                courseStats: dashboard.courseStats || [],
                topCourses: dashboard.topCourses || [],
                monthlyEarnings: dashboard.monthlyEarnings || [],
                enrolledStudents: dashboard.enrolledStudents || []
            }
        });
    } catch (error) {
        console.error('Force sync error:', error);
        res.json({ success: false, message: error.message });
    }
};

// DEBUG: Check all purchases for educator
export const debugPurchases = async (req, res) => {
    try {
        const educator = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId;

        const courses = await Course.find({ educator });
        const courseIds = courses.map(c => c._id);

        const allPurchases = await Purchase.find({ courseId: { $in: courseIds } })
            .populate('userId', 'name')
            .populate('courseId', 'courseTitle educator');

        const purchaseStats = {
            educatorId: educator,
            totalCourses: courses.length,
            total: allPurchases.length,
            byStatus: {
                pending: allPurchases.filter(p => p.status === 'pending').length,
                completed: allPurchases.filter(p => p.status === 'completed').length,
                failed: allPurchases.filter(p => p.status === 'failed').length
            },
            courses: courses.map(c => ({
                id: c._id,
                title: c.courseTitle,
                educator: c.educator
            })),
            purchases: allPurchases.map(p => ({
                id: p._id,
                courseId: p.courseId?._id,
                course: p.courseId?.courseTitle,
                courseEducator: p.courseId?.educator,
                student: p.userId?.name,
                studentId: p.userId?._id,
                amount: p.amount,
                status: p.status,
                createdAt: p.createdAt
            }))
        };

        res.json({ success: true, purchaseStats });
    } catch (error) {
        console.error('Debug error:', error);
        res.json({ success: false, message: error.message });
    }
};
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId;

        // Fetch all courses created by the educator
        const courses = await Course.find({ educator });

        // Get the list of course IDs
        const courseIds = courses.map(course => course._id);

        // Fetch purchases with user and course data
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle');

        // enrolled students data
        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({
            success: true,
            enrolledStudents
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};
