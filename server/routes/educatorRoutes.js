import express from 'express'
import { applyForEducator, addCourse, getEducatorCourses, educatorDashboardData, getEnrolledStudentsData, forceSyncDashboard, debugPurchases, togglePublishCourse } from '../controllers/educatorController.js'
import { uploadCourseDocument, getCourseDocuments, deleteCourseDocument } from '../controllers/courseController.js'
import upload from '../configs/multer.js'
import { protectEducator, protectRoute, syncUserToDB } from '../middlewares/authMiddleware.js'


const educatorRouter = express.Router()

educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)
educatorRouter.post('/dashboard/sync', protectEducator, forceSyncDashboard)
educatorRouter.get('/debug/purchases', protectEducator, debugPurchases)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)
educatorRouter.post('/toggle-publish', protectEducator, togglePublishCourse);

// Course Document routes
educatorRouter.post('/course/:courseId/documents', upload.single('document'), protectEducator, uploadCourseDocument);
educatorRouter.get('/course/:courseId/documents', protectRoute, getCourseDocuments);
educatorRouter.delete('/course/:courseId/documents/:documentId', protectEducator, deleteCourseDocument);

export default educatorRouter