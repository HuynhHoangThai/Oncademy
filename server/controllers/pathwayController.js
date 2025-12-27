import PathwayCourse from '../models/PathwayCourse.js';
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';
import { getUserId } from '../utils/authHelper.js';
import { v2 as cloudinary } from 'cloudinary';
import { syncEducatorDashboard } from '../utils/dashboardHelper.js';
import stripe from 'stripe';

// Create new pathway
export const createPathway = async (req, res) => {
    try {
        const { pathwayData } = req.body;
        const imageFile = req.file;
        const educatorId = getUserId(req);

        if (!educatorId) {
            return res.json({ success: false, message: 'Unauthorized - No userId' });
        }

        if (!imageFile) {
            return res.json({ success: false, message: 'Thumbnail Not Attached' });
        }

        const parsedPathwayData = JSON.parse(pathwayData);

        // Set pathway metadata
        parsedPathwayData.educator = educatorId;
        parsedPathwayData.approvalStatus = 'pending';
        parsedPathwayData.isPublished = false;
        parsedPathwayData.approvedBy = null;
        parsedPathwayData.rejectionReason = '';

        const newPathway = await PathwayCourse.create(parsedPathwayData);

        // Upload thumbnail to cloudinary
        const b64 = Buffer.from(imageFile.buffer).toString('base64');
        const dataURI = `data:${imageFile.mimetype};base64,${b64}`;

        const imageUpload = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'auto'
        });

        newPathway.pathwayThumbnail = imageUpload.secure_url;
        await newPathway.save();

        // Sync educator dashboard
        await syncEducatorDashboard(educatorId).catch(err => {
            console.error('Dashboard sync error:', err);
        });

        res.json({
            success: true,
            message: 'Pathway submitted successfully! Please wait for Admin approval.'
        });

    } catch (error) {
        console.error('Create pathway error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all pathways for educator
export const getEducatorPathways = async (req, res) => {
    try {
        const educatorId = getUserId(req);

        if (!educatorId) {
            return res.json({ success: false, message: 'Unauthorized' });
        }

        const pathways = await PathwayCourse.find({ educator: educatorId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, pathways });

    } catch (error) {
        console.error('Get educator pathways error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get all published pathways (public)
export const getAllPathways = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order === 'asc' ? 1 : -1;

        // Build query
        const query = { isPublished: true };
        if (search) {
            query.pathwayTitle = { $regex: search, $options: 'i' };
        }

        // Build sort object
        const sortObj = {};
        if (sort === 'price') {
            sortObj.pathwayPrice = order;
        } else if (sort === 'rating') {
            sortObj.createdAt = -1;
        } else {
            sortObj.createdAt = order;
        }

        // Execute query with pagination
        const [pathways, total] = await Promise.all([
            PathwayCourse.find(query)
                .select(['-phases', '-enrolledStudents']) // Exclude large fields for list view
                .populate({ path: 'educator', select: 'name imageUrl email' })
                .sort(sortObj)
                .skip(skip)
                .limit(limit)
                .lean(),
            PathwayCourse.countDocuments(query)
        ]);

        // Calculate phase count for each pathway
        const pathwaysWithStats = await Promise.all(pathways.map(async (pathway) => {
            const fullPathway = await PathwayCourse.findById(pathway._id).select('phases');
            const phaseCount = fullPathway?.phases?.length || 0;

            // Calculate total chapters and lectures
            let totalChapters = 0;
            let totalLectures = 0;
            fullPathway?.phases?.forEach(phase => {
                totalChapters += phase.chapters?.length || 0;
                phase.chapters?.forEach(chapter => {
                    totalLectures += chapter.chapterContent?.length || 0;
                });
            });

            return {
                ...pathway,
                phaseCount,
                totalChapters,
                totalLectures
            };
        }));

        res.json({
            success: true,
            pathways: pathwaysWithStats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get all pathways error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get pathway by ID
export const getPathwayById = async (req, res) => {
    const { id } = req.params;

    try {
        const pathway = await PathwayCourse.findById(id)
            .populate({ path: 'educator' });

        if (!pathway) {
            return res.json({ success: false, message: 'Pathway not found' });
        }

        // Remove lecture URLs if not preview free (for non-enrolled students)
        pathway.phases.forEach(phase => {
            phase.chapters.forEach(chapter => {
                chapter.chapterContent.forEach(lecture => {
                    if (!lecture.isPreviewFree) {
                        lecture.lectureUrl = "";
                    }
                });
            });
        });

        res.json({ success: true, pathwayData: pathway });

    } catch (error) {
        console.error('Get pathway by ID error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get pathway for edit (educator only - includes all lectureUrls)
export const getPathwayForEdit = async (req, res) => {
    const { id } = req.params;
    const educatorId = getUserId(req);

    try {
        const pathway = await PathwayCourse.findById(id)
            .populate({ path: 'educator' });

        if (!pathway) {
            return res.json({ success: false, message: 'Pathway not found' });
        }

        // Check ownership
        if (pathway.educator._id.toString() !== educatorId) {
            return res.json({ success: false, message: 'Unauthorized - You can only edit your own pathways' });
        }

        // Return full data including all lectureUrls
        res.json({ success: true, pathwayData: pathway });

    } catch (error) {
        console.error('Get pathway for edit error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Update pathway
export const updatePathway = async (req, res) => {
    const { id } = req.params;
    const educatorId = getUserId(req);
    const imageFile = req.file;

    try {
        const { pathwayData } = req.body;

        const pathway = await PathwayCourse.findById(id);

        if (!pathway) {
            return res.json({ success: false, message: 'Pathway not found' });
        }

        // Check ownership
        if (pathway.educator.toString() !== educatorId) {
            return res.json({ success: false, message: 'Unauthorized - You can only update your own pathways' });
        }

        const parsedPathwayData = JSON.parse(pathwayData);

        // If rejected, reset to pending when updating
        if (pathway.approvalStatus === 'rejected') {
            parsedPathwayData.approvalStatus = 'pending';
            parsedPathwayData.isPublished = false;
            parsedPathwayData.rejectionReason = '';
        }

        // Upload new thumbnail if provided
        if (imageFile) {
            // Delete old thumbnail
            if (pathway.pathwayThumbnail) {
                const publicId = pathway.pathwayThumbnail.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId).catch(err => {
                    console.error('Error deleting old thumbnail:', err);
                });
            }

            // Upload new thumbnail
            const b64 = Buffer.from(imageFile.buffer).toString('base64');
            const dataURI = `data:${imageFile.mimetype};base64,${b64}`;

            const imageUpload = await cloudinary.uploader.upload(dataURI, {
                resource_type: 'auto'
            });

            parsedPathwayData.pathwayThumbnail = imageUpload.secure_url;
        }

        // Update pathway
        const updatedPathway = await PathwayCourse.findByIdAndUpdate(
            id,
            { $set: parsedPathwayData },
            { new: true, runValidators: true }
        );

        // Sync dashboard
        await syncEducatorDashboard(educatorId).catch(err => {
            console.error('Dashboard sync error:', err);
        });

        res.json({
            success: true,
            message: 'Pathway updated successfully',
            pathwayData: updatedPathway
        });

    } catch (error) {
        console.error('Update pathway error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Delete pathway
export const deletePathway = async (req, res) => {
    const { id } = req.params;
    const educatorId = getUserId(req);

    try {
        const pathway = await PathwayCourse.findById(id);

        if (!pathway) {
            return res.json({ success: false, message: 'Pathway not found' });
        }

        // Check ownership
        if (pathway.educator.toString() !== educatorId) {
            return res.json({ success: false, message: 'Unauthorized - You can only delete your own pathways' });
        }

        // Update purchases status
        await Purchase.updateMany(
            { pathwayId: id },
            { $set: { status: 'failed' } } // Refunded might be better but status enum is 'failed' for now or just failed
        );

        // Remove from user favorites
        await User.updateMany(
            { favoritePathways: id },
            { $pull: { favoritePathways: id } }
        );

        // Delete pathway
        await PathwayCourse.findByIdAndDelete(id);

        // Sync dashboard
        await syncEducatorDashboard(educatorId).catch(err => {
            console.error('Dashboard sync error:', err);
        });

        res.json({ success: true, message: 'Pathway deleted successfully' });

    } catch (error) {
        console.error('Delete pathway error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Toggle publish pathway
export const togglePublishPathway = async (req, res) => {
    const { pathwayId } = req.body;
    const educatorId = getUserId(req);

    try {
        const pathway = await PathwayCourse.findById(pathwayId);

        if (!pathway) {
            return res.json({ success: false, message: 'Pathway not found' });
        }

        // Check ownership
        if (pathway.educator.toString() !== educatorId) {
            return res.json({ success: false, message: 'Unauthorized' });
        }

        // Check approval status
        if (pathway.approvalStatus !== 'approved') {
            return res.json({
                success: false,
                message: 'Pathway must be approved by Admin before publishing'
            });
        }

        // Toggle publish status
        pathway.isPublished = !pathway.isPublished;
        await pathway.save();

        res.json({
            success: true,
            message: pathway.isPublished ? 'Pathway published successfully' : 'Pathway unpublished successfully',
            isPublished: pathway.isPublished
        });

    } catch (error) {
        console.error('Toggle publish pathway error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Purchase Pathway (create Stripe session)
export const purchasePathway = async (req, res) => {
    try {
        const { pathwayId } = req.body;
        const { origin } = req.headers;
        const userId = getUserId(req);

        if (!userId) {
            return res.json({ success: false, message: 'User not authenticated' });
        }

        if (!pathwayId) {
            return res.json({ success: false, message: 'Pathway ID is required' });
        }

        const pathwayData = await PathwayCourse.findById(pathwayId);
        const userData = await User.findById(userId);

        if (!userData || !pathwayData) {
            return res.json({ success: false, message: 'Data Not Found' });
        }

        // Check if user is already enrolled
        const isAlreadyEnrolled = pathwayData.enrolledStudents.some(
            studentId => studentId.toString() === userId
        );

        if (isAlreadyEnrolled) {
            return res.json({
                success: false,
                message: 'You are already enrolled in this pathway',
                alreadyEnrolled: true
            });
        }

        // Check if there's a pending purchase for this pathway
        const existingPurchase = await Purchase.findOne({
            pathwayId: pathwayData._id,
            userId,
            status: { $in: ['pending', 'completed'] }
        });

        if (existingPurchase) {
            if (existingPurchase.status === 'completed') {
                return res.json({
                    success: false,
                    message: 'You have already purchased this pathway',
                    alreadyEnrolled: true
                });
            }
            // If pending, allow creating new checkout session (old one might be abandoned)
            console.log('Found pending purchase, creating new checkout session');
        }

        const amount = Number((pathwayData.pathwayPrice - pathwayData.discount * pathwayData.pathwayPrice / 100).toFixed(2));

        const purchaseData = {
            pathwayId: pathwayData._id,
            userId,
            amount
        };

        const newPurchase = await Purchase.create(purchaseData);

        // Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        const currency = (process.env.CURRENCY || 'usd').toLowerCase();

        // Creating line items for Stripe
        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: pathwayData.pathwayTitle
                },
                unit_amount: Math.round(amount * 100) // Stripe expects amount in cents
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        });

        res.json({ success: true, sessionUrl: session.url });

    } catch (error) {
        console.error('Purchase pathway error:', error);
        res.json({ success: false, message: error.message });
    }
};
