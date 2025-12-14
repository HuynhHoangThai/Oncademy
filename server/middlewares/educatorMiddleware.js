import { getUserId } from '../utils/authHelper.js';
import { clerkClient } from '@clerk/express';

const educatorMiddleware = async (req, res, next) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Get user role from Clerk
        const user = await clerkClient.users.getUser(userId);
        const userRole = user.publicMetadata?.role;

        if (userRole !== 'educator') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access Denied: Educator role required'
            });
        }

        // Set userId for downstream controllers
        req.userId = userId;
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export default educatorMiddleware