import express from 'express'
import { applyForEducator, addCourse,getEducatorCourses,educatorDashboardData,getEnrolledStudentsData, forceSyncDashboard, debugPurchases, togglePublishCourse } from '../controllers/educatorController.js'
import upload from '../configs/multer.js'
import { protectEducator, syncUserToDB } from '../middlewares/authMiddleware.js'


const educatorRouter = express.Router()

educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)
educatorRouter.post('/dashboard/sync', protectEducator, forceSyncDashboard)
educatorRouter.get('/debug/purchases', protectEducator, debugPurchases)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)
educatorRouter.post('/toggle-publish', protectEducator, togglePublishCourse);
export default educatorRouter