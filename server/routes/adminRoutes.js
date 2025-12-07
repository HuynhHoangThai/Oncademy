import express from 'express';
import { approveEducator, demoteEducator, getPendingEducatorApplications, getUserDetails, getUsersListByRole, rejectEducator } from '../controllers/adminController.js';
import { protectAdmin, syncUserToDB } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/applications/pending', getPendingEducatorApplications);
router.get('/users', getUsersListByRole);
router.get('/users/:userId', getUserDetails);
router.post('/demote-educator', demoteEducator);
router.post('/approve-educator', approveEducator);
router.post('/reject-educator', rejectEducator);

export default router;