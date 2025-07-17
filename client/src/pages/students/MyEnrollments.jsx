
import { AppContext } from '../../context/AppContext';
import { useContext } from 'react';
import {Line} from 'rc-progress'
import { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/students/Footer';

const MyEnrollments = () => {
  const { enrolledCourses, calculateCourseDuration} = useContext(AppContext);
  const navigate = useNavigate();
  const [progressArray,setProgressArray] = useState([
    {lectureCompleted: 4, totalLectures: 4},
    {lectureCompleted: 6, totalLectures: 10},
    {lectureCompleted: 2, totalLectures: 10},
    {lectureCompleted: 8, totalLectures: 10},
    {lectureCompleted: 5, totalLectures: 10},
    {lectureCompleted: 3, totalLectures: 3},
    {lectureCompleted: 2, totalLectures: 2},
    {lectureCompleted: 7, totalLectures: 10},
    {lectureCompleted: 1, totalLectures: 10},
    {lectureCompleted: 9, totalLectures: 9},
    {lectureCompleted: 10, totalLectures: 10},
    {lectureCompleted: 4, totalLectures: 10},
    {lectureCompleted: 6, totalLectures: 10},
    {lectureCompleted: 2, totalLectures: 10},
  ]);
 

  return (
    <>
    <div className='md:px-36 px-8 pt-10'></div>
    <div className="max-w-6xl mx-auto p-6">
      <h1 className='text-2xl font-semibold'>My Enrollments</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="md:table-auto table-fixed w-full overflow-hidden border-amber-50 mt-10">
          <thead className="text-gray-50 border-b border-gray-50 text-sm text-left max-sm:hidden">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate">
                Course
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate max-sm:hidden">
                Duration
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate max-sm:hidden">
                Completed
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate">
                Status
              </th>
            </tr>
          </thead>
          <tbody className='text-gray-700 '>
            {enrolledCourses.map((course,index) => (
              <tr key={index} className="border-b border-gray-500/20">
                <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 ">
                  <img src={course.courseThumbnail} alt="" className="w-14  sm:w-24 md:w-28" />
                  <div className='flex-1'>
                    <p className='mb-1 max-sm:text-sm'>{course.courseTitle}</p>
                    <Line className='bg-gray-300 rounded-full' strokeWidth={2} percent={progressArray[index] ? (progressArray[index].lectureCompleted * 100) / progressArray[index].totalLectures : 0} />
                  </div>
                </td>
                <td className="px-4 py-3 max-sm:hidden">{calculateCourseDuration(course)}</td>
                <td className="px-4 py-3 max-sm:hidden">{progressArray[index] && `${progressArray[index].lectureCompleted} / ${progressArray[index].totalLectures}`}<span>Lectures</span></td>
                <td className="px-4 py-3 max-sm:text-right">
                  <button className={`px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs text-white rounded ${
                    progressArray[index] && progressArray[index].lectureCompleted / progressArray[index].totalLectures === 1 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-500 hover:bg-gray-600'
                  }`} onClick={()=>navigate(`/player/${course._id}`)}>
                    {progressArray[index] && progressArray[index].lectureCompleted / progressArray[index].totalLectures === 1 ? 'Completed' : 'On Going'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <Footer />
  </>
  )
}

export default MyEnrollments
