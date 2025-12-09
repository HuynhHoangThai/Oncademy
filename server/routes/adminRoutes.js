import express from 'express';
import { approveCourse, approveEducator, demoteEducator, getAdminDashboardStats, getPendingCourses, getPendingEducatorApplications, getRevenueTrend, getUserDetails, getUsersListByRole, rejectCourse, rejectEducator, toggleBanUser } from '../controllers/adminController.js';

const router = express.Router();

router.get('/applications/pending', getPendingEducatorApplications);
router.get('/users', getUsersListByRole);
router.get('/users/:userId', getUserDetails);
router.get('/dashboard-stats', getAdminDashboardStats);
router.get('/revenue-trend', getRevenueTrend);
router.post('/ban-user', toggleBanUser);
router.post('/demote-educator', demoteEducator);
router.post('/approve-educator', approveEducator);
router.post('/reject-educator', rejectEducator);
router.get('/courses/pending', getPendingCourses);
router.post('/courses/approve', approveCourse);
router.post('/courses/reject', rejectCourse);

export default router;