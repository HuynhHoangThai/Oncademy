import express from 'express';
import { approveEducator, demoteEducator, getAdminDashboardStats, getPendingEducatorApplications, getRevenueTrend, getUserDetails, getUsersListByRole, rejectEducator } from '../controllers/adminController.js';

const router = express.Router();

router.get('/applications/pending', getPendingEducatorApplications);
router.get('/users', getUsersListByRole);
router.get('/users/:userId', getUserDetails);
router.get('/dashboard-stats', getAdminDashboardStats);
router.get('/revenue-trend', getRevenueTrend);
router.post('/demote-educator', demoteEducator);
router.post('/approve-educator', approveEducator);
router.post('/reject-educator', rejectEducator);

export default router;