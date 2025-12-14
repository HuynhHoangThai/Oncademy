import { clerkClient } from "@clerk/express"
import { getUserId } from "../utils/authHelper.js"
import User from '../models/User.js';

// Middleware to protect any authenticated route
export const protectRoute = async (req, res, next) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized Access - Please sign in'
            });
        }

        // Set userId for downstream controllers
        req.userId = userId;
        next();
    } catch (error) {
        console.error('protectRoute error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Middleware ( Protect Educator Routes )
export const protectEducator = async (req, res, next) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized Access - No userId'
            });
        }

        const response = await clerkClient.users.getUser(userId);

        if (response.publicMetadata.role !== 'educator') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized Access - Not an educator'
            });
        }

        // Set userId for downstream controllers
        req.userId = userId;
        next();
    } catch (error) {
        console.error('protectEducator error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const protectAdmin = async (req, res, next) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized Access - No userId'
            });
        }

        const response = await clerkClient.users.getUser(userId);

        if (response.publicMetadata.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized Access - Admin role required'
            });
        }

        req.userId = userId;
        next();
    } catch (error) {
        console.error('protectAdmin error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const syncUserToDB = async (req, res, next) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            console.log("Sync Middleware: No userId found, skipping sync.");
            return next();
        }

        const clerkUser = await clerkClient.users.getUser(userId);

        const userMetadata = {
            name: clerkUser.firstName + ' ' + clerkUser.lastName,
            email: clerkUser.emailAddresses[0].emailAddress,
            imageUrl: clerkUser.imageUrl,
            applicationStatus: clerkUser.publicMetadata.applicationStatus || 'none',
            resume: clerkUser.publicMetadata.resume || null,
            role: clerkUser.publicMetadata.role || 'student',
        };

        const dbUser = await User.findOneAndUpdate(
            { _id: userId },
            { $set: userMetadata },
            { upsert: true, new: true, select: '-password -__v' }
        );

        req.user = dbUser;
        req.userId = userId;
        next();
    } catch (error) {
        console.error("🚨 User Synchronization Error:", error.message);
        return res.status(500).json({ success: false, message: "Error during user synchronization." });
    }
};