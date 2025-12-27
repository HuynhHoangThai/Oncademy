import express from 'express';
import { approveCourse, approveEducator, approvePathway, demoteEducator, getAdminDashboardStats, getPendingCourses, getPendingEducatorApplications, getPendingPathways, getRevenueTrend, getUserDetails, getUsersListByRole, rejectCourse, rejectEducator, rejectPathway, toggleBanUser } from '../controllers/adminController.js';

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
// Pathway approval routes
router.get('/pathways/pending', getPendingPathways);
router.post('/pathways/approve', approvePathway);
router.post('/pathways/reject', rejectPathway);

export default router;