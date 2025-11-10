import React, {useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/students/Loading';
import { toast } from 'react-toastify';

const MyCourses = () => {
<<<<<<< HEAD

  const {currency, backendUrl, isEducator, getToken} = useContext(AppContext);
  const [courses, setCourses] = useState(null)

  const fetchEducatorCourses = async () => {
    try {
      const token = await getToken();
      const {data} = await axios.get(backendUrl + '/api/educator/courses',
        {headers: {Authorization: `Bearer ${token}`}})

      data.success && setCourses(data.course)
      
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    if(isEducator){
      fetchEducatorCourses();
    }
  }, [isEducator]);
=======
  const {currency, allCourses} = useContext(AppContext);
  const [courses, setCourses] = useState([])
  useEffect(() => {
    // Keep local courses in sync with context
    setCourses(allCourses || [])
  }, [allCourses])
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2

  return courses ? (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-5xl flex flex-col gap-10">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">My Courses</h1>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-50 text-blue-700">
              <tr>
                <th className="px-4 py-3 font-semibold text-left">Course</th>
                <th className="px-4 py-3 font-semibold text-center">Earnings</th>
                <th className="px-4 py-3 font-semibold text-center">Students</th>
                <th className="px-4 py-3 font-semibold text-center">Published On</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {courses.map((course) => (
                <tr key={course._id} className="border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                  <td className="px-4 py-3 flex items-center gap-4 min-w-[220px]">
                    <img src={course.courseThumbnail} alt="Course" className="w-14 h-14 rounded-lg object-cover border-2 border-blue-200 shadow" />
                    <span className="truncate font-semibold text-lg">{course.courseTitle}</span>
                  </td>
                  {
                    (() => {
                      const students = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0
                      const price = Number(course.coursePrice || 0)
                      const discount = Number(course.discount || 0)
                      const revenue = Math.floor(students * (price - (discount * price) / 100))
                      return (
                        <>
                          <td className="px-4 py-3 text-center font-bold text-blue-700">{currency}{revenue}</td>
                          <td className="px-4 py-3 text-center font-medium">{students}</td>
                        </>
                      )
                    })()
                  }
                  <td className="px-4 py-3 text-center text-gray-500">{new Date(course.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : <Loading />
}
export default MyCourses
