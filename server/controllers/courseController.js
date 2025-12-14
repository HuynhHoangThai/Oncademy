import Course from "../models/Course.js";
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
            .populate({ path: 'educator'})

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
 