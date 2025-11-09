import User from '../models/User.js'

const educatorMiddleware = async (req, res, next) => {
    try {
        const userId = req.auth().userId
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }

        const user = await User.findById(userId)
        if (!user || user.publicMetadata?.role !== 'educator') {
            return res.status(403).json({ success: false, message: 'Access Denied: Educator role required' })
        }

        next()
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

export default educatorMiddleware