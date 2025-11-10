import express from 'express'
<<<<<<< HEAD
import {addUserRating, getUserCourseProgress, getUserData, purchaseCourse, updateUserCourseProgress, userEnrolledCourses } from '../controllers/userController.js'
=======
import { getUserData, userEnrolledCourses,purchaseCourse,updateUserCourseProgress,getUserCourseProgress,addUserRating } from '../controllers/userController.js'
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2

const userRouter = express.Router()

userRouter.get('/data', getUserData)
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.post('/purchase', purchaseCourse)
<<<<<<< HEAD

userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post('get-course-progress', getUserCourseProgress)
=======
userRouter.post('/update-progress', updateUserCourseProgress)
userRouter.post('/get-progress', getUserCourseProgress)
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
userRouter.post('/add-rating', addUserRating)

export default userRouter
