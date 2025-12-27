import express from 'express';
import {
    createPathway,
    getEducatorPathways,
    getAllPathways,
    getPathwayById,
    getPathwayForEdit,
    updatePathway,
    deletePathway,
    togglePublishPathway,
    purchasePathway
} from '../controllers/pathwayController.js';
import { protectEducator } from '../middlewares/authMiddleware.js';
import upload from '../configs/multer.js';

const pathwayRouter = express.Router();

// Public routes
pathwayRouter.get('/all', getAllPathways); // Get all published pathways
pathwayRouter.get('/:id', getPathwayById); // Get pathway by ID
pathwayRouter.post('/purchase', purchasePathway); // Purchase pathway

// Educator routes
pathwayRouter.post('/create', upload.single('image'), protectEducator, createPathway);
pathwayRouter.get('/educator/pathways', protectEducator, getEducatorPathways);
pathwayRouter.get('/educator/edit/:id', protectEducator, getPathwayForEdit); // Get full pathway for editing
pathwayRouter.put('/:id', upload.single('image'), protectEducator, updatePathway);
pathwayRouter.delete('/:id', protectEducator, deletePathway);
pathwayRouter.post('/toggle-publish', protectEducator, togglePublishPathway);

export default pathwayRouter;
