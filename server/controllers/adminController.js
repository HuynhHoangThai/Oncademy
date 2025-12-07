import User from '../models/User.js';
import { clerkClient } from '@clerk/express';
import { getUserId } from '../utils/authHelper.js'; 

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

        // 2. Cập nhật MongoDB
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
        const { role } = req.query; 

        let query = {};
        if (role) {
            query.role = role.toLowerCase();
        }

        const users = await User.find(query).select('_id name email role imageUrl applicationStatus');

        return res.json({
            success: true,
            users
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