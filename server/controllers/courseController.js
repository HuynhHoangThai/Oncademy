import Course from "../models/Course.js";
import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { getUserId } from "../utils/authHelper.js";
import { v2 as cloudinary } from 'cloudinary';
import { syncEducatorDashboard } from '../utils/dashboardHelper.js';

export const getAllCourse = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const sort = req.query.sort || 'createdAt'; // createdAt, price, rating
        const order = req.query.order === 'asc' ? 1 : -1;

        // Build query
        const query = { isPublished: true };
        if (search) {
            query.courseTitle = { $regex: search, $options: 'i' };
        }

        // Build sort object
        const sortObj = {};
        if (sort === 'price') {
            sortObj.coursePrice = order;
        } else if (sort === 'rating') {
            // Sort by average rating (would need to calculate)
            sortObj.createdAt = -1;
        } else {
            sortObj.createdAt = order;
        }

        // Execute query with pagination
        const [courses, total] = await Promise.all([
            Course.find(query)
                .select(['-courseContent', '-enrolledStudents'])
                .populate({ path: 'educator', select: 'name imageUrl email' })
                .sort(sortObj)
                .skip(skip)
                .limit(limit)
                .lean(),
            Course.countDocuments(query)
        ]);

        res.json({
            success: true,
            courses,
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
        res.json({ success: false, message: error.message })
    }

}
export const getCourseId = async (req, res) => {

    const { id } = req.params

    try {

        const courseData = await Course.findById(id)
            .populate({ path: 'educator' })

        // Remove lectureUrl if isPreviewFree is false
        courseData.courseContent.forEach(chapter => {
            chapter.chapterContent.forEach(lecture => {
                if (!lecture.isPreviewFree) {
                    lecture.lectureUrl = "";
                }
            });
        });

        res.json({ success: true, courseData })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Delete Course (Educator only)
export const deleteCourse = async (req, res) => {
    const { id } = req.params
    const educatorId = getUserId(req)

    try {
        // Find course and verify ownership
        const course = await Course.findById(id)

        if (!course) {
            return res.json({ success: false, message: 'Course not found' })
        }

        // Check if user is the educator of this course
        if (course.educator.toString() !== educatorId) {
            return res.json({ success: false, message: 'Unauthorized - You can only delete your own courses' })
        }

        // Delete associated quizzes
        await Quiz.deleteMany({ courseId: id })

        // Delete quiz attempts for this course
        await QuizAttempt.deleteMany({ courseId: id })

        // Update purchases status (optional - mark as inactive instead of deleting)
        await Purchase.updateMany(
            { courseId: id },
            { $set: { status: 'refunded' } }
        )

        await User.updateMany(
            { favoriteCourses: id },
            { $pull: { favoriteCourses: id } }
        );

        // Delete the course
        await Course.findByIdAndDelete(id)

        // Sync dashboard after deletion
        await syncEducatorDashboard(educatorId).catch(err => {
            console.error('Dashboard sync error after delete:', err)
        })

        res.json({ success: true, message: 'Course deleted successfully' })

    } catch (error) {
        console.error('Error deleting course:', error)
        res.json({ success: false, message: error.message })
    }
}

// Update Course (Educator only)
export const updateCourse = async (req, res) => {
    const { id } = req.params
    const educatorId = getUserId(req)
    const imageFile = req.file

    try {
        const { courseData } = req.body

        // Find course and verify ownership
        const course = await Course.findById(id)

        if (!course) {
            return res.json({ success: false, message: 'Course not found' })
        }

        // Check if user is the educator of this course
        if (course.educator.toString() !== educatorId) {
            return res.json({ success: false, message: 'Unauthorized - You can only update your own courses' })
        }

        // Parse course data
        const parsedCourseData = JSON.parse(courseData)

        if (course.approvalStatus === 'rejected') {
            parsedCourseData.approvalStatus = 'pending';
            parsedCourseData.isPublished = false;
            parsedCourseData.rejectionReason = '';
        }

        // Upload new thumbnail if provided
        if (imageFile) {
            // Delete old thumbnail from cloudinary if exists
            if (course.courseThumbnail) {
                const publicId = course.courseThumbnail.split('/').pop().split('.')[0]
                await cloudinary.uploader.destroy(publicId).catch(err => {
                    console.error('Error deleting old thumbnail:', err)
                })
            }

            // Upload new thumbnail
            const b64 = Buffer.from(imageFile.buffer).toString('base64')
            const dataURI = `data:${imageFile.mimetype};base64,${b64}`

            const imageUpload = await cloudinary.uploader.upload(dataURI, {
                resource_type: 'auto'
            })

            parsedCourseData.courseThumbnail = imageUpload.secure_url
        }

        // Update course
        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            { $set: parsedCourseData },
            { new: true, runValidators: true }
        )

        // Sync dashboard after update
        await syncEducatorDashboard(educatorId).catch(err => {
            console.error('Dashboard sync error after update:', err)
        })

        res.json({ success: true, message: 'Course updated successfully', courseData: updatedCourse })

    } catch (error) {
        console.error('Error updating course:', error)
        res.json({ success: false, message: error.message })
    }
}

// Upload Course Document (Educator only)
export const uploadCourseDocument = async (req, res) => {
    const { courseId } = req.params;
    const educatorId = getUserId(req);
    const file = req.file;

    try {
        if (!file) {
            return res.json({ success: false, message: 'No file provided' });
        }

        // Find course and verify ownership
        const course = await Course.findById(courseId);

        if (!course) {
            return res.json({ success: false, message: 'Course not found' });
        }

        if (course.educator.toString() !== educatorId) {
            return res.json({ success: false, message: 'Unauthorized - You can only upload to your own courses' });
        }

        // Upload PDF to cloudinary
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;

        const uploadResult = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'raw',
            folder: 'course_documents',
            format: 'pdf'
        });

        // Create document object
        const newDocument = {
            documentId: `doc_${Date.now()}`,
            documentTitle: req.body.documentTitle || file.originalname,
            documentUrl: uploadResult.secure_url,
            uploadedAt: new Date()
        };

        // Add to course documents
        course.documents.push(newDocument);
        await course.save();

        res.json({
            success: true,
            message: 'Document uploaded successfully',
            document: newDocument
        });

    } catch (error) {
        console.error('Error uploading document:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get Course Documents (for enrolled students)
export const getCourseDocuments = async (req, res) => {
    const { courseId } = req.params;
    const userId = getUserId(req);

    try {
        const course = await Course.findById(courseId).select('documents enrolledStudents educator');

        if (!course) {
            return res.json({ success: false, message: 'Course not found' });
        }

        // Check if user is enrolled or is the educator
        const isEnrolled = course.enrolledStudents.includes(userId);
        const isEducator = course.educator.toString() === userId;

        if (!isEnrolled && !isEducator) {
            return res.json({ success: false, message: 'You must be enrolled to access documents' });
        }

        res.json({
            success: true,
            documents: course.documents || []
        });

    } catch (error) {
        console.error('Error fetching documents:', error);
        res.json({ success: false, message: error.message });
    }
};

// Delete Course Document (Educator only)
export const deleteCourseDocument = async (req, res) => {
    const { courseId, documentId } = req.params;
    const educatorId = getUserId(req);

    try {
        const course = await Course.findById(courseId);

        if (!course) {
            return res.json({ success: false, message: 'Course not found' });
        }

        if (course.educator.toString() !== educatorId) {
            return res.json({ success: false, message: 'Unauthorized - You can only delete from your own courses' });
        }

        // Find and remove document
        const docIndex = course.documents.findIndex(doc => doc.documentId === documentId);

        if (docIndex === -1) {
            return res.json({ success: false, message: 'Document not found' });
        }

        // Remove from cloudinary (optional - extract public_id)
        const docUrl = course.documents[docIndex].documentUrl;
        try {
            const publicId = docUrl.split('/').slice(-2).join('/').split('.')[0];
            await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        } catch (err) {
            console.error('Error deleting from cloudinary:', err);
        }

        // Remove from course
        course.documents.splice(docIndex, 1);
        await course.save();

        res.json({ success: true, message: 'Document deleted successfully' });

    } catch (error) {
        console.error('Error deleting document:', error);
        res.json({ success: false, message: error.message });
    }
};
