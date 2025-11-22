import express from 'express'
import { getAllCourse, getCourseId, deleteCourse, updateCourse } from '../controllers/courseController.js';
import { protectEducator } from '../middlewares/authMiddleware.js'
import upload from '../configs/multer.js'

const courseRouter = express.Router()

// Get All Course
courseRouter.get('/all', getAllCourse)

// Get Course Data By Id
courseRouter.get('/:id', getCourseId)

// Delete Course (Educator only)
courseRouter.delete('/:id', protectEducator, deleteCourse)

// Update Course (Educator only)
courseRouter.put('/:id', upload.single('image'), protectEducator, updateCourse)

export default courseRouter;