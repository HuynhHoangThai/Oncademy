import express from 'express'
import { updateRoleToEducator, addCourse,getEducatorCourses,educatorDashboardData,getEnrolledStudentsData, forceSyncDashboard, debugPurchases } from '../controllers/educatorController.js'
import upload from '../configs/multer.js'
import { protectEducator } from '../middlewares/authMiddleware.js'


const educatorRouter = express.Router()

educatorRouter.get('/update-role', updateRoleToEducator)
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)
educatorRouter.post('/dashboard/sync', protectEducator, forceSyncDashboard)
educatorRouter.get('/debug/purchases', protectEducator, debugPurchases)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)
export default educatorRouter