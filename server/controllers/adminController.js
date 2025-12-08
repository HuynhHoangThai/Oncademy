import User from '../models/User.js';
import { clerkClient } from '@clerk/express';
import { getUserId } from '../utils/authHelper.js'; 
import Course from '../models/Course.js';
import { Purchase } from '../models/Purchase.js';

export const getPendingEducatorApplications = async (req, res) => {
    try {

        const pendingUsers = await User.find({ applicationStatus: 'pending' }).select('-enrolledCourses -password -__v');

        return res.json({
            success: true,
            applications: pendingUsers
        });

    } catch (error) {
        console.error('Get Pending Applications Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const approveEducator = async (req, res) => {
    try {

        const { userIdToApprove } = req.body;

        if (!userIdToApprove) {
            return res.json({ success: false, message: 'User ID is required for approval.' });
        }

        await clerkClient.users.updateUserMetadata(userIdToApprove, {
            publicMetadata: {
                role: 'educator',
                applicationStatus: 'approved',
            },
        });

        const updatedUser = await User.findByIdAndUpdate(
            userIdToApprove,
            {
                applicationStatus: 'approved',
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.json({ success: false, message: 'User Not Found in Database.' });
        }

        return res.json({ success: true, message: `Educator role approved for user ${userIdToApprove}.` });

    } catch (error) {
        console.error('Approve Educator Error:', error);
        if (error.status === 404) {
            return res.status(404).json({ success: false, message: 'Clerk User Not Found.' });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const rejectEducator = async (req, res) => {
    try {
        const { userIdToReject } = req.body;

        if (!userIdToReject) {
            return res.status(400).json({ success: false, message: 'User ID is required for rejection.' });
        }

        await clerkClient.users.updateUserMetadata(userIdToReject, {
            publicMetadata: {
                applicationStatus: 'rejected',
            },
        });

        const updatedUser = await User.findByIdAndUpdate(
            userIdToReject,
            {
                applicationStatus: 'rejected',
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User Not Found in Database.' });
        }

        return res.json({ success: true, message: `Educator application rejected for user ${userIdToReject}.` });

    } catch (error) {
        console.error('Reject Educator Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getUsersListByRole = async (req, res) => {
    try {
        const { role, page = 1, limit = 10 } = req.query; 

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        if (isNaN(pageNumber) || pageNumber <= 0) return res.status(400).json({ success: false, message: 'Invalid page number.' });
        if (isNaN(limitNumber) || limitNumber <= 0) return res.status(400).json({ success: false, message: 'Invalid limit.' });

        let query = {};
        if (role) {
            query.role = role.toLowerCase();
        }

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limitNumber);

        const users = await User.find(query)
            .select('_id name email role imageUrl applicationStatus')
            .sort({ createdAt: -1 }) 
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        return res.json({
            success: true,
            users,
            currentPage: pageNumber,
            totalPages,
            totalUsers
        });

    } catch (error) {
        console.error('Get Users List Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const demoteEducator = async (req, res) => {
    try {
        const { userIdToDemote } = req.body;

        if (!userIdToDemote) {
            return res.status(400).json({ success: false, message: 'User ID is required for demotion.' });
        }

        await clerkClient.users.updateUserMetadata(userIdToDemote, {
            publicMetadata: {
                role: 'student',
                applicationStatus: 'none', 
            },
        });

        const updatedUser = await User.findByIdAndUpdate(
            userIdToDemote,
            {
                role: 'student',
                applicationStatus: 'none',
                // Tùy chọn: Xóa các khóa học đã tạo nếu bạn muốn khóa quyền Educator vĩnh viễn
                // createdCourses: [] 
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User Not Found in Database.' });
        }

        return res.json({ success: true, message: `Educator demoted to Student successfully for user ${userIdToDemote}.` });

    } catch (error) {
        console.error('Demote Educator Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required.' });
        }

        const user = await User.findById(userId)
            .select('-passwordHash -__v')
            .populate({
                path: 'createdCourses',
                select: 'courseTitle isPublished coursePrice' 
            })
            .populate({
                path: 'enrolledCourses',
                select: 'title published price'
            })
            .exec();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        return res.json({ success: true, user });

    } catch (error) {
        console.error('Get User Details Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error while fetching user details.' });
    }
};

const calculateGlobalStats = async () => {
    const startOfCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const purchaseStats = await Purchase.aggregate([
        { $match: { status: 'completed' } }, 
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: '$amount' },
                totalPurchases: { $sum: 1 },
                monthlyPurchases: {
                    $sum: {
                        $cond: [
                            { $gte: ['$createdAt', startOfCurrentMonth] },
                            1, 0
                        ]
                    }
                }
            }
        }
    ]);
    const totalUsers = await User.countDocuments({});
    const totalCourses = await Course.countDocuments({});
    const totalPublishedCourses = await Course.countDocuments({ isPublished: true });

    const topCourses = await Purchase.aggregate([
        { $match: { status: 'completed' } },
        {
            $group: {
                _id: '$courseId',
                purchaseCount: { $sum: 1 },
                totalRevenue: { $sum: '$amount' }
            }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'courses', 
                localField: '_id',
                foreignField: '_id',
                as: 'courseDetails'
            }
        },
        { $unwind: '$courseDetails' },
        {
            $project: {
                _id: 0,
                courseTitle: '$courseDetails.courseTitle',
                totalRevenue: 1,
                purchaseCount: 1
            }
        }
    ]);

    const recentEnrollments = await Purchase.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
            path: 'courseId',
            select: 'courseTitle'
        })
        .select('userId amount createdAt')
        .lean(); 

    const stats = purchaseStats[0] || {};

    const userIds = recentEnrollments.map(e => e.userId);
    const userMap = {};
    if (userIds.length > 0) {
        const usersData = await User.find({ _id: { $in: userIds } }).select('name').lean();
        usersData.forEach(u => userMap[u._id] = u.name);
    }

    const finalRecentEnrollments = recentEnrollments.map(e => ({
        studentName: userMap[e.userId] || 'Unknown User',
        courseTitle: e.courseId.courseTitle,
        amount: e.amount,
        date: e.createdAt.toLocaleDateString(), 
    }));

    const courseStatusDistribution = [
        { label: "Published", count: totalPublishedCourses },
        { label: "Draft", count: totalCourses - totalPublishedCourses },
    ];

    const priceDistribution = await Purchase.aggregate([
        { $match: { status: 'completed' } },
        {
            $group: {
                _id: {
                    $switch: {
                        branches: [
                            { case: { $lte: ['$amount', 20] }, then: '0-20' },
                            { case: { $and: [{ $gt: ['$amount', 20] }, { $lte: ['$amount', 50] }] }, then: '21-50' },
                            { case: { $and: [{ $gt: ['$amount', 50] }, { $lte: ['$amount', 100] }] }, then: '51-100' },
                        ],
                        default: '100+'
                    }
                },
                count: { $sum: 1 } 
            }
        },
        { $sort: { _id: 1 } }
    ]);

    return {
        totalEarnings: stats.totalEarnings || 0,
        totalPurchases: stats.totalPurchases || 0,
        totalEnrollments: totalUsers || 0, 
        totalCourses: totalCourses || 0,

        monthlyEarnings: [], 
        topCourses: [], 
        priceDistribution: priceDistribution,
        recentEnrollments: finalRecentEnrollments,
        courseStatusDistribution: courseStatusDistribution,
    };
};


export const getAdminDashboardStats = async (req, res) => {
    try {
        const dashboardData = await calculateGlobalStats();

        return res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Get Admin Dashboard Stats Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getRevenueByInterval = async (interval = 'monthly', limit = 6) => {

    let dateOperator;
    let labelFormat;

    switch (interval) {
        case 'weekly':
            dateOperator = { year: { $isoWeekYear: "$createdAt" }, week: { $isoWeek: "$createdAt" } };
            labelFormat = 'W_Y';
            break;
        case 'yearly':
            dateOperator = { year: { $year: "$createdAt" } };
            labelFormat = 'YYYY';
            break;
        case 'monthly':
        default:
            dateOperator = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
            labelFormat = 'MMM_YYYY';
            break;
    }

    const revenueData = await Purchase.aggregate([
        { $match: { status: 'completed' } },
        {
            $group: {
                _id: dateOperator,
                earnings: { $sum: '$amount' },
                purchaseCount: { $sum: 1 } 
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } },
        { $limit: parseInt(limit) },
    ]);

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const finalRevenueData = revenueData.map(item => {
        let label;
        if (item._id.month) { 
            label = `${MONTHS[item._id.month - 1]} ${item._id.year}`;
        } else if (item._id.week) { 
            label = `Wk ${item._id.week} ${item._id.year}`;
        } else if (item._id.year) { 
            label = `${item._id.year}`;
        }

        return {
            month: label, 
            earnings: item.earnings,
        };
    });

    return finalRevenueData;
};

export const getRevenueTrend = async (req, res) => {
    try {
        const { interval = 'monthly', limit = 6 } = req.query;

        const monthlyEarnings = await getRevenueByInterval(interval, limit);

        return res.json({
            success: true,
            monthlyEarnings: monthlyEarnings
        });

    } catch (error) {
        console.error('Get Revenue Trend Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};