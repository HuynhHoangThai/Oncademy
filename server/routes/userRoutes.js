import express from 'express'
import { getUserData, userEnrolledCourses, userEnrolledPathways, purchaseCourse, updateUserCourseProgress, getUserCourseProgress, addUserRating, getUserFavorites, toggleFavoriteCourse, updatePathwayProgress, getPathwayProgress, addPathwayRating, toggleFavoritePathway } from '../controllers/userController.js'
import { applyForEducator } from '../controllers/educatorController.js'
import { syncUserToDB } from '../middlewares/authMiddleware.js';

const userRouter = express.Router()

userRouter.use(syncUserToDB);

userRouter.get('/data', getUserData)
userRouter.get('/enrolled-courses', userEnrolledCourses)
userRouter.get('/enrolled-pathways', userEnrolledPathways)
userRouter.post('/update-pathway-progress', updatePathwayProgress)
userRouter.post('/get-pathway-progress', getPathwayProgress)
userRouter.post('/rate-pathway', addPathwayRating)
userRouter.get('/favorites', getUserFavorites)
userRouter.post('/purchase', purchaseCourse)
userRouter.post('/update-progress', updateUserCourseProgress)
userRouter.post('/get-progress', getUserCourseProgress)
userRouter.post('/add-rating', addUserRating)
userRouter.post('/apply-educator', applyForEducator);
userRouter.post('/toggle-favorite', toggleFavoriteCourse);
userRouter.post('/toggle-favorite-pathway', toggleFavoritePathway);


export default userRouter
