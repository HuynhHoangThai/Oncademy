import express from 'express'
import { getAllCourse, getCourseId, getCourseForEdit, deleteCourse, updateCourse } from '../controllers/courseController.js';
import { protectEducator } from '../middlewares/authMiddleware.js'
import upload from '../configs/multer.js'

const courseRouter = express.Router()

// Get All Course
courseRouter.get('/all', getAllCourse)

// Get Course for Edit (Educator only - with full lectureUrls)
courseRouter.get('/educator/edit/:id', protectEducator, getCourseForEdit)

// Get Course Data By Id (public - no lectureUrls for non-preview)
courseRouter.get('/:id', getCourseId)

// Delete Course (Educator only)
courseRouter.delete('/:id', protectEducator, deleteCourse)

// Update Course (Educator only)
courseRouter.put('/:id', upload.single('image'), protectEducator, updateCourse)

export default courseRouter;