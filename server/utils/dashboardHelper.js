
import Dashboard from '../models/Dashboard.js';
import Course from '../models/Course.js';
import PathwayCourse from '../models/PathwayCourse.js';
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

        // 1b. Inherit data from PathwayCourse table
        const pathways = await PathwayCourse.find({ educator: educatorId })
            .select('pathwayTitle pathwayThumbnail pathwayPrice enrolledStudents createdAt')
            .lean();

        const totalCourses = courses.length + pathways.length;
        const courseIds = courses.map(course => course._id);
        const pathwayIds = pathways.map(pathway => pathway._id);

        // 2. Inherit data from Purchase table (Courses + Pathways)
        const purchases = await Purchase.find({
            $or: [
                { courseId: { $in: courseIds } },
                { pathwayId: { $in: pathwayIds } }
            ],
            status: 'completed'
        })
            .populate('userId', 'name imageUrl email')
            .populate('courseId', 'courseTitle courseThumbnail')
            .populate('pathwayId', 'pathwayTitle pathwayThumbnail')
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
        // Also get from PathwayCourse.enrolledStudents
        pathways.forEach(pathway => {
            if (pathway.enrolledStudents && Array.isArray(pathway.enrolledStudents)) {
                pathway.enrolledStudents.forEach(studentId => {
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
        const recentEnrollments = purchases.slice(0, 50).map(purchase => {
            // Determine if it's a course or pathway
            const isCourse = !!purchase.courseId;
            const itemTitle = isCourse ? purchase.courseId?.courseTitle : purchase.pathwayId?.pathwayTitle;
            const itemThumbnail = isCourse ? purchase.courseId?.courseThumbnail : purchase.pathwayId?.pathwayThumbnail;

            return {
                studentId: purchase.userId?._id,
                studentName: purchase.userId?.name || 'Unknown',
                studentEmail: purchase.userId?.email || '',
                studentImage: purchase.userId?.imageUrl || '',
                courseId: purchase.courseId?._id || purchase.pathwayId?._id, // Use pathwayId as fallback, handled as "courseId" in schema
                courseTitle: itemTitle || 'Unknown Item',
                courseThumbnail: itemThumbnail || '',
                amount: purchase.amount || 0,
                enrolledAt: purchase.createdAt,
                purchaseId: purchase._id
            };
        });

        // 7. Course statistics (Include Pathways)
        // Format pathways to match course structure
        const pathwayStats = pathways.map(pathway => ({
            courseId: pathway._id,
            courseTitle: pathway.pathwayTitle,
            courseThumbnail: pathway.pathwayThumbnail,
            coursePrice: pathway.pathwayPrice,
            enrolledCount: pathway.enrolledStudents ? pathway.enrolledStudents.length : 0,
            createdAt: pathway.createdAt
        }));

        const originalCourseStats = courses.map(course => ({
            courseId: course._id,
            courseTitle: course.courseTitle,
            courseThumbnail: course.courseThumbnail,
            coursePrice: course.coursePrice,
            enrolledCount: course.enrolledStudents ? course.enrolledStudents.length : 0,
            createdAt: course.createdAt
        }));

        const courseStats = [...originalCourseStats, ...pathwayStats];


        // 8. Calculate revenue per course/pathway (from Purchase)
        const revenuePerItem = {};
        purchases.forEach(purchase => {
            const itemId = purchase.courseId?._id?.toString() || purchase.pathwayId?._id?.toString();
            // Determine title
            const isCourse = !!purchase.courseId;
            const itemTitle = isCourse ? purchase.courseId?.courseTitle : purchase.pathwayId?.pathwayTitle;

            if (itemId) {
                if (!revenuePerItem[itemId]) {
                    revenuePerItem[itemId] = {
                        courseTitle: itemTitle,
                        totalRevenue: 0,
                        purchaseCount: 0
                    };
                }
                revenuePerItem[itemId].totalRevenue += Number(purchase.amount) || 0;
                revenuePerItem[itemId].purchaseCount += 1;
            }
        });

        // 9. Top performing courses (and pathways)
        const topCourses = Object.entries(revenuePerItem)
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
