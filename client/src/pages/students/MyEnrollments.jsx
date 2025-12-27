
import { AppContext } from '../../context/AppContext';
import { useContext, useState } from 'react';
import { Line } from 'rc-progress'
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/students/Footer';

const MyEnrollments = () => {
  const { enrolledCourses, enrolledPathways, calculateCourseDuration, calculateNoOfLectures } = useContext(AppContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState('courses');


  return (
    <>
      <div className='md:px-36 px-8 pt-20 pb-8 bg-gradient-to-b from-cyan-100/70 to-white'>
        <h1 className='text-4xl font-semibold text-gray-800'>My Enrollments</h1>
        <p className='text-gray-500 mt-2'>Track your learning progress and continue your courses</p>
      </div>
      <div className="max-w-6xl mx-auto p-6 -mt-4 min-h-screen">

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            className={`pb-2 px-4 font-medium transition-colors relative ${tab === 'courses' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab('courses')}
          >
            Individual Courses
            {tab === 'courses' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
          <button
            className={`pb-2 px-4 font-medium transition-colors relative ${tab === 'pathways' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab('pathways')}
          >
            Course Combos
            {tab === 'pathways' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
        </div>

        {tab === 'courses' ? (
          enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No courses enrolled</h3>
              <p className="text-gray-500 mb-6">Start your learning journey by enrolling in a course!</p>
              <button
                onClick={() => navigate('/course-list')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Browse Courses
              </button>
            </div>
          ) : (

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="md:table-auto table-fixed w-full overflow-hidden border-amber-50">
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
                  {enrolledCourses.map((course, index) => {
                    const totalLectures = calculateNoOfLectures(course)
                    const progress = course.progress || { progressPercentage: 0, lecturesCompleted: 0, completed: false }
                    const progressPercent = progress.progressPercentage || 0

                    return (
                      <tr key={index} className="border-b border-gray-500/20">
                        <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 ">
                          <img src={course.courseThumbnail} alt="" className="w-14  sm:w-24 md:w-28" />
                          <div className='flex-1'>
                            <p className='mb-1 max-sm:text-sm'>{course.courseTitle}</p>
                            <Line className='bg-gray-300 rounded-full' strokeWidth={2} percent={progressPercent} />
                          </div>
                        </td>
                        <td className="px-4 py-3 max-sm:hidden">{calculateCourseDuration(course)}</td>
                        <td className="px-4 py-3 max-sm:hidden">
                          {progress.lecturesCompleted} / {totalLectures} <span>Lectures</span>
                        </td>
                        <td className="px-4 py-3 max-sm:text-right">
                          <button className={`px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs text-white rounded ${progress.completed || progressPercent === 100
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-500 hover:bg-blue-600'
                            }`} onClick={() => navigate(`/player/${course._id}`)}>
                            {progress.completed || progressPercent === 100 ? 'Completed' : 'Continue'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // PATHWAYS TAB
          enrolledPathways.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No combos enrolled</h3>
              <p className="text-gray-500 mb-6">Explore our curated learning pathways!</p>
              <button
                onClick={() => navigate('/')} // Redirect to home where combos are listed
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
              >
                Browse Combos
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="md:table-auto table-fixed w-full overflow-hidden border-amber-50">
                <thead className="text-gray-50 border-b border-gray-50 text-sm text-left max-sm:hidden">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate">
                      Combo Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate max-sm:hidden">
                      Total Phases
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate max-sm:hidden">
                      lectures
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 truncate">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className='text-gray-700 '>
                  {enrolledPathways.map((pathway, index) => {
                    // Calculate stats manually for now
                    let totalLectures = 0;
                    pathway.phases?.forEach(phase => {
                      phase.chapters?.forEach(chapter => {
                        totalLectures += chapter.chapterContent?.length || 0;
                      });
                    });

                    return (
                      <tr key={index} className="border-b border-gray-500/20 hover:bg-gray-50">
                        <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 ">
                          {pathway.pathwayThumbnail ? (
                            <img src={pathway.pathwayThumbnail} alt="" className="w-14 sm:w-24 md:w-28 rounded object-cover aspect-video" />
                          ) : (
                            <div className="w-14 sm:w-24 md:w-28 bg-gray-200 rounded aspect-video flex items-center justify-center text-gray-400">
                              No Img
                            </div>
                          )}
                          <div className='flex-1'>
                            <p className='mb-1 font-semibold max-sm:text-sm text-gray-800'>{pathway.pathwayTitle}</p>
                            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">Combo</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-sm:hidden">
                          {pathway.phases?.length || 0} Phases
                        </td>
                        <td className="px-4 py-3 max-sm:hidden">
                          {totalLectures} Lectures
                        </td>
                        <td className="px-4 py-3 max-sm:text-right">
                          <button className="px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs text-white rounded bg-teal-600 hover:bg-teal-700 transition-colors"
                            onClick={() => navigate(`/pathway-player/${pathway._id}`)}>
                            Start Learning
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
      <Footer />
    </>

  )
}

export default MyEnrollments
