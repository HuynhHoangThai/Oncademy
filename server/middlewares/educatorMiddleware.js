const educatorMiddleware = async (req, res, next) => {
    try {
        const auth = req.auth();
        const userId = auth?.userId;
        const sessionClaims = auth?.sessionClaims;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Get role from Clerk session claims (publicMetadata)
        const userRole = sessionClaims?.publicMetadata?.role;

        if (userRole !== 'educator') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access Denied: Educator role required'
            });
        }

        next();
    } catch (error) {
        console.error('Educator middleware error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export default educatorMiddleware