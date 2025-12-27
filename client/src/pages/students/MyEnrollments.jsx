
import { AppContext } from '../../context/AppContext';
import { useContext, useState } from 'react';
import { Line } from 'rc-progress'
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/students/Footer';

const MyEnrollments = () => {
  const { enrolledCourses, enrolledPathways, calculateCourseDuration, calculateNoOfLectures } = useContext(AppContext);
  const navigate = useNavigate();


  return (
    <>
      <div className='md:px-36 px-8 pt-20 pb-8 bg-gradient-to-b from-cyan-100/70 to-white'>
        <h1 className='text-4xl font-semibold text-gray-800'>My Enrollments</h1>
        <p className='text-gray-500 mt-2'>Track your learning progress and continue your courses</p>
      </div>
      <div className="max-w-6xl mx-auto p-6 -mt-4 min-h-screen">



        {(enrolledCourses.length === 0 && enrolledPathways.length === 0) ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No enrollments yet</h3>
            <p className="text-gray-500 mb-6">Start your learning journey by enrolling in a course or combo!</p>
            <button
              onClick={() => navigate('/course-list')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Browse Content
            </button>
          </div>
        ) : (

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="md:table-auto table-fixed w-full overflow-hidden border-amber-50">
              <thead className="text-gray-50 border-b border-gray-50 text-sm text-left max-sm:hidden">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate">
                    Course / Combo Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate max-sm:hidden">
                    Duration / Structure
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate max-sm:hidden">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className='text-gray-700 '>
                {/* Render Courses */}
                {enrolledCourses.map((course, index) => {
                  const totalLectures = calculateNoOfLectures(course)
                  const progress = course.progress || { progressPercentage: 0, lecturesCompleted: 0, completed: false }
                  const progressPercent = progress.progressPercentage || 0

                  return (
                    <tr key={`course-${index}`} className="border-b border-gray-500/20 hover:bg-gray-50">
                      <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 ">
                        <img src={course.courseThumbnail} alt="" className="w-14 sm:w-24 md:w-28 rounded object-cover aspect-video" />
                        <div className='flex-1'>
                          <p className='mb-1 font-semibold max-sm:text-sm text-gray-800'>{course.courseTitle}</p>
                          <Line className='bg-gray-300 rounded-full' strokeWidth={2} percent={progressPercent} />
                        </div>
                      </td>
                      <td className="px-4 py-3 max-sm:hidden">{calculateCourseDuration(course)}</td>
                      <td className="px-4 py-3 max-sm:hidden">
                        {progress.lecturesCompleted} / {totalLectures} <span>Lectures</span>
                      </td>
                      <td className="px-4 py-3 max-sm:text-right">
                        <button className={`px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs text-white rounded transition-colors ${progress.completed || progressPercent === 100
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                          }`} onClick={() => navigate(`/player/${course._id}`)}>
                          {progress.completed || progressPercent === 100 ? 'Completed' : 'Continue'}
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {/* Render Pathways */}
                {enrolledPathways.map((pathway, index) => {
                  let totalLectures = 0;
                  pathway.phases?.forEach(phase => {
                    phase.chapters?.forEach(chapter => {
                      totalLectures += chapter.chapterContent?.length || 0;
                    });
                  });

                  const progress = pathway.progress || { progressPercentage: 0, lecturesCompleted: 0, completed: false }
                  const progressPercent = progress.progressPercentage || 0

                  return (
                    <tr key={`pathway-${index}`} className="border-b border-gray-500/20 hover:bg-gray-50 bg-teal-50/30">
                      <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 ">
                        <div className="relative">
                          {pathway.pathwayThumbnail ? (
                            <img src={pathway.pathwayThumbnail} alt="" className="w-14 sm:w-24 md:w-28 rounded object-cover aspect-video" />
                          ) : (
                            <div className="w-14 sm:w-24 md:w-28 bg-gray-200 rounded aspect-video flex items-center justify-center text-gray-400">
                              No Img
                            </div>
                          )}
                          <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm sm:hidden">Combo</span>
                        </div>
                        <div className='flex-1'>
                          <div className="flex items-center gap-2 mb-1">
                            <p className='font-semibold max-sm:text-sm text-gray-800'>{pathway.pathwayTitle}</p>
                            <span className="max-sm:hidden text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-medium border border-teal-200">Combo</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{pathway.phases?.length || 0} Phases</p>
                          <Line className='bg-gray-300 rounded-full' strokeWidth={2} percent={progressPercent} strokeColor="#0d9488" />
                        </div>
                      </td>
                      <td className="px-4 py-3 max-sm:hidden">
                        {/* Structure Info for Combo */}
                        <span className="text-sm text-gray-600">{pathway.phases?.length || 0} Phases</span>
                      </td>
                      <td className="px-4 py-3 max-sm:hidden">
                        {/* Progress info for Combo */}
                        <span className="text-sm text-gray-600">
                          {progress.lecturesCompleted} / {totalLectures} Lectures
                        </span>
                      </td>
                      <td className="px-4 py-3 max-sm:text-right">
                        <button className={`px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs text-white rounded transition-colors shadow-sm ${progress.completed || progressPercent === 100 ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'
                          }`}
                          onClick={() => navigate(`/pathway-player/${pathway._id}`)}>
                          {progress.completed || progressPercent === 100 ? 'Completed' : (progressPercent > 0 ? 'Continue' : 'Start Learning')}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
        }
      </div>
      <Footer />
    </>

  )
}

export default MyEnrollments
