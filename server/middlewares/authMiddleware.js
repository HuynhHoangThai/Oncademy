import { clerkClient } from "@clerk/express"
import { getUserId } from "../utils/authHelper.js"

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