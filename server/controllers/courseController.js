import Course from "../models/Course.js";

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
 
 