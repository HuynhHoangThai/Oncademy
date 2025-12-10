import { clerkClient } from '@clerk/express'
import Course from '../models/Course.js'
import { Purchase } from '../models/Purchase.js'
import User from '../models/User.js'
import { v2 as cloudinary } from 'cloudinary'
import { getEducatorDashboard, syncEducatorDashboard } from '../utils/dashboardHelper.js'
import { getUserId } from '../utils/authHelper.js'

export const applyForEducator = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }

        const { resumeUrl } = req.body;

        if (!resumeUrl) {
            return res.json({ success: false, message: 'Resume URL is required' });
        }

        await User.findByIdAndUpdate(userId,
            {
                applicationStatus: 'pending',
                resume: resumeUrl
            },
            { new: true }
        );

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                applicationStatus: 'pending',
                resume: resumeUrl
            },
        });

        res.json({ success: true, message: 'CV is being checked.' });

    } catch (error) {
        console.error('Apply for educator error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export const addCourse = async (req, res) => {

    try {

        const { courseData } = req.body

        const imageFile = req.file

        const educatorId = getUserId(req);

        if (!educatorId) {
            return res.json({ success: false, message: 'Unauthorized - No userId' });
        }

        if (!imageFile) {
            return res.json({ success: false, message: 'Thumbnail Not Attached' })
        }

        const parsedCourseData = await JSON.parse(courseData)

        parsedCourseData.educator = educatorId;
        parsedCourseData.approvalStatus = 'pending';
        parsedCourseData.isPublished = false;
        parsedCourseData.approvedBy = null;
        parsedCourseData.rejectionReason = '';

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

        res.json({
            success: true,
            message: 'Course submitted successfully! Please wait for Admin approval.'
        })

    } catch (error) {

        res.json({ success: false, message: error.message })

    }
}

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
    try {
        const educator = getUserId(req);

        if (!educator) {
            return res.json({ success: false, message: 'Unauthorized - No userId' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const total = await Course.countDocuments({ educator });

        // Use aggregation pipeline for better performance
        const coursesWithEducator = await Course.aggregate([
            { $match: { educator } },
            {
                $lookup: {
                    from: 'quizzes',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'quizzes'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'educator',
                    foreignField: '_id',
                    as: 'educatorInfo'
                }
            },
            {
                $addFields: {
                    quizCount: { $size: '$quizzes' },
                    educator: { $arrayElemAt: ['$educatorInfo', 0] }
                }
            },
            {
                $project: {
                    quizzes: 0,
                    educatorInfo: 0,
                    'educator.password': 0,
                    'educator.enrolledCourses': 0
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        res.json({
            success: true,
            courses: coursesWithEducator,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const educatorDashboardData = async (req, res) => {
    try {
        const educator = getUserId(req);

        if (!educator) {
            return res.json({ success: false, message: 'Unauthorized - No userId' });
        }

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
        const educator = getUserId(req);

        if (!educator) {
            return res.json({ success: false, message: 'Unauthorized - No userId' });
        }

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
        const educator = getUserId(req);

        if (!educator) {
            return res.json({ success: false, message: 'Unauthorized - No userId' });
        }

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
        const educator = getUserId(req);

        if (!educator) {
            return res.json({ success: false, message: 'Unauthorized - No userId' });
        }

        // Fetch all courses created by the educator
        const courses = await Course.find({ educator });

        // Get the list of course IDs
        const courseIds = courses.map(course => course._id);

        // Fetch purchases with user and course data
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        })
            .populate('userId', 'name imageUrl email')
            .populate('courseId', 'courseTitle')
            .sort({ createdAt: -1 }); // Sort by newest first

        // enrolled students data with amount
        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId?.courseTitle || 'Unknown Course',
            amount: purchase.amount || 0,
            purchaseDate: purchase.createdAt
        }));

        res.json({
            success: true,
            enrolledStudents,
            total: enrolledStudents.length
        });

    } catch (error) {
        console.error('Get enrolled students error:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

export const togglePublishCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const educatorId = getUserId(req);

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Kiểm tra quyền sở hữu
        if (course.educator.toString() !== educatorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // 🚨 QUAN TRỌNG: Chỉ cho phép Publish nếu đã được Approved
        if (course.approvalStatus !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Course must be approved by Admin before publishing.'
            });
        }

        // Toggle trạng thái
        course.isPublished = !course.isPublished;
        await course.save();

        return res.json({
            success: true,
            message: `Course is now ${course.isPublished ? 'Published' : 'Unpublished'}.`,
            isPublished: course.isPublished
        });

    } catch (error) {
        console.error('Toggle Publish Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};