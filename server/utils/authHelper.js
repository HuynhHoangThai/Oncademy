/**
 * Helper function to get userId from request
 * Handles both function and object syntax for req.auth
 * @param {Object} req - Express request object
 * @returns {string|null} - User ID or null if not found
 */
export const getUserId = (req) => {
    try {
        // Clerk v5+ uses req.auth() as a function
        if (typeof req.auth === 'function') {
            const auth = req.auth();
            return auth?.userId || null;
        }
        // Fallback for older versions (should not happen in new code)
        return req.auth?.userId || null;
    } catch (error) {
        return null;
    }
};

export default getUserId;

