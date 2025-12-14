import Dashboard from '../models/Dashboard.js';
import Course from '../models/Course.js';
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';

/**
 * Sync and update educator dashboard data from Course, Purchase, User tables
 * This function inherits data from multiple tables and stores in Dashboard model
 */
export const syncEducatorDashboard = async (educatorId) => {
    try {
        // 1. Inherit data from Course table
        const courses = await Course.find({ educator: educatorId })
            .select('courseTitle courseThumbnail coursePrice enrolledStudents createdAt')
            .lean();
        
        const totalCourses = courses.length;
        const courseIds = courses.map(course => course._id);

        // 2. Inherit data from Purchase table
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        })
        .populate('userId', 'name imageUrl email')
        .populate('courseId', 'courseTitle courseThumbnail')
        .sort({ createdAt: -1 })
        .lean();

        // 3. Calculate total earnings from Purchase
        const totalEarnings = purchases.reduce((sum, purchase) => {
            return sum + (Number(purchase.amount) || 0);
        }, 0);

        const totalPurchases = purchases.length;

        // 4. Get unique students from PURCHASES (more accurate than Course.enrolledStudents)
        const uniqueStudentIdsFromPurchases = new Set();
        purchases.forEach(purchase => {
            if (purchase.userId && purchase.userId._id) {
                uniqueStudentIdsFromPurchases.add(purchase.userId._id.toString());
            }
        });
        
        // Also get from Course.enrolledStudents for students added via webhook
        const uniqueStudentIdsFromCourses = new Set();
        courses.forEach(course => {
            if (course.enrolledStudents && Array.isArray(course.enrolledStudents)) {
                course.enrolledStudents.forEach(studentId => {
                    uniqueStudentIdsFromCourses.add(studentId.toString());
                });
            }
        });
        
        // Merge both sets to get all unique students
        const allUniqueStudentIds = new Set([
            ...uniqueStudentIdsFromPurchases,
            ...uniqueStudentIdsFromCourses
        ]);
        
        const totalEnrollments = allUniqueStudentIds.size;

        // 5. Get detailed student info from User table
        const enrolledStudents = await User.find({
            _id: { $in: Array.from(allUniqueStudentIds) }
        }).select('name imageUrl email createdAt').lean();

        // 6. Recent enrollments (from Purchase)
        const recentEnrollments = purchases.slice(0, 50).map(purchase => ({
            studentId: purchase.userId?._id,
            studentName: purchase.userId?.name || 'Unknown',
            studentEmail: purchase.userId?.email || '',
            studentImage: purchase.userId?.imageUrl || '',
            courseId: purchase.courseId?._id,
            courseTitle: purchase.courseId?.courseTitle || 'Unknown Course',
            courseThumbnail: purchase.courseId?.courseThumbnail || '',
            amount: purchase.amount || 0,
            enrolledAt: purchase.createdAt,
            purchaseId: purchase._id
        }));

        // 7. Course statistics
        const courseStats = courses.map(course => ({
            courseId: course._id,
            courseTitle: course.courseTitle,
            courseThumbnail: course.courseThumbnail,
            coursePrice: course.coursePrice,
            enrolledCount: course.enrolledStudents ? course.enrolledStudents.length : 0,
            createdAt: course.createdAt
        }));

        // 8. Calculate revenue per course (from Purchase)
        const revenuePerCourse = {};
        purchases.forEach(purchase => {
            const courseId = purchase.courseId?._id?.toString();
            if (courseId) {
                if (!revenuePerCourse[courseId]) {
                    revenuePerCourse[courseId] = {
                        courseTitle: purchase.courseId?.courseTitle,
                        totalRevenue: 0,
                        purchaseCount: 0
                    };
                }
                revenuePerCourse[courseId].totalRevenue += Number(purchase.amount) || 0;
                revenuePerCourse[courseId].purchaseCount += 1;
            }
        });

        // 9. Top performing courses
        const topCourses = Object.entries(revenuePerCourse)
            .map(([courseId, data]) => ({
                courseId,
                courseTitle: data.courseTitle,
                totalRevenue: data.totalRevenue,
                purchaseCount: data.purchaseCount
            }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);

        // 10. Monthly earnings (last 6 months from Purchase)
        const monthlyEarnings = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthlyEarnings[monthKey] = 0;
        }

        purchases.forEach(purchase => {
            const purchaseDate = new Date(purchase.createdAt);
            const monthKey = purchaseDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (monthlyEarnings.hasOwnProperty(monthKey)) {
                monthlyEarnings[monthKey] += Number(purchase.amount) || 0;
            }
        });

        // 11. Update or create Dashboard document with inherited data
        const dashboard = await Dashboard.findOneAndUpdate(
            { educatorId },
            {
                $set: {
                    educatorId,
                    totalCourses,
                    totalEarnings,
                    totalEnrollments,
                    totalPurchases,
                    recentEnrollments,
                    courseStats,
                    topCourses,
                    monthlyEarnings: Object.entries(monthlyEarnings).map(([month, earnings]) => ({
                        month,
                        earnings
                    })),
                    enrolledStudents: enrolledStudents.map(student => ({
                        id: student._id,
                        name: student.name,
                        email: student.email,
                        imageUrl: student.imageUrl,
                        joinedAt: student.createdAt
                    })),
                    lastUpdated: new Date()
                }
            },
            { 
                upsert: true, 
                new: true,
                setDefaultsOnInsert: true,
                runValidators: true
            }
        );

        return dashboard;
    } catch (error) {
        console.error('Sync dashboard error:', error);
        throw error;
    }
};

/**
 * Get educator dashboard data (from Dashboard model only)
 */
export const getEducatorDashboard = async (educatorId) => {
    try {
        let dashboard = await Dashboard.findOne({ educatorId });
        
        // If no dashboard exists or data is stale (older than 5 minutes), sync it
        if (!dashboard || (new Date() - dashboard.lastUpdated) > 5 * 60 * 1000) {
            dashboard = await syncEducatorDashboard(educatorId);
        }
        
        return dashboard;
    } catch (error) {
        console.error('Get dashboard error:', error);
        throw error;
    }
};
