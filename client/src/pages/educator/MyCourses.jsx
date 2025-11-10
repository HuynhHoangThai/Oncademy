import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../../components/students/Loading';

const MyCourses = () => {
  const { getToken } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [quizStats, setQuizStats] = useState({ totalAttempts: 0, avgScore: 0, passRate: 0 })
  const [studentAttempts, setStudentAttempts] = useState([])
  const [showStudentDetails, setShowStudentDetails] = useState(false)
  const currency = '$'
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  // Fetch courses từ API
  const fetchCourses = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/educator/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  // Fetch quiz statistics
  const fetchQuizStats = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/quiz/stats/educator`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        setQuizStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching quiz stats:', error)
    }
  }

  // Fetch student quiz attempts
  const fetchStudentAttempts = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/quiz/stats/student-attempts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        setStudentAttempts(data.studentAttempts || [])
      }
    } catch (error) {
      console.error('Error fetching student attempts:', error)
    }
  }

  // Sync dashboard để cập nhật số liệu chính xác
  const syncDashboard = async () => {
    try {
      setSyncing(true)
      const token = await getToken()
      await axios.post(`${backendUrl}/api/educator/dashboard/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Fetch lại courses sau khi sync
      await fetchCourses()
      toast.success('Data synced successfully')
    } catch (error) {
      console.error('Error syncing dashboard:', error)
      toast.error('Failed to sync data')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchCourses()
      await fetchQuizStats()
      await fetchStudentAttempts()
    }
    
    loadData()
    
    // Auto-refresh mỗi 30 giây
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <Loading />

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl flex flex-col gap-6">
        {/* Header with Sync Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">My Courses</h1>
          <button
            onClick={syncDashboard}
            disabled={syncing}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all w-full sm:w-auto ${
              syncing 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            {syncing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </span>
            ) : (
              'Sync Data'
            )}
          </button>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 overflow-x-auto">
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="mt-4 text-gray-500 text-lg font-medium">No courses yet</p>
              <p className="text-gray-400 text-sm mb-6">Create your first course to get started</p>
              <button
                onClick={() => window.location.href = '/educator/add-course'}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Create Course
              </button>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-blue-50 text-blue-700">
                <tr>
                  <th className="px-4 py-3 font-semibold text-left">Course</th>
                  <th className="px-4 py-3 font-semibold text-center hidden md:table-cell">Price</th>
                  <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">Students</th>
                  <th className="px-4 py-3 font-semibold text-center hidden lg:table-cell">Quizzes</th>
                  <th className="px-4 py-3 font-semibold text-center hidden xl:table-cell">Published On</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {courses.map((course) => {
                  const students = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0
                  const price = Number(course.coursePrice || 0)
                  const discount = Number(course.discount || 0)
                  const finalPrice = price - (discount * price) / 100
                  const quizCount = course.quizCount || 0
                  
                  return (
                    <tr key={course._id} className="border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                      <td className="px-4 py-3 min-w-[220px]">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <img 
                            src={course.courseThumbnail} 
                            alt={course.courseTitle}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border-2 border-blue-200 shadow flex-shrink-0" 
                          />
                          <span className="truncate font-semibold text-sm sm:text-base lg:text-lg">{course.courseTitle}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium hidden md:table-cell">
                        {discount > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="line-through text-gray-400 text-xs">{currency}{price}</span>
                            <span className="text-blue-700 font-bold">{currency}{finalPrice.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-blue-700">{currency}{price}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {students}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          {quizCount} Quizzes
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs sm:text-sm hidden xl:table-cell">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Stats */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
              <p className="text-gray-500 text-sm">Total Courses</p>
              <p className="text-2xl font-bold text-blue-700">{courses.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
              <p className="text-gray-500 text-sm">Total Students</p>
              <p className="text-2xl font-bold text-blue-700">
                {courses.reduce((sum, course) => sum + (Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
              <p className="text-gray-500 text-sm mb-2">Quiz Statistics</p>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Total Attempts:</span>
                  <span className="text-sm font-bold text-purple-700">{quizStats.totalAttempts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Avg Score:</span>
                  <span className="text-sm font-bold text-blue-700">{quizStats.avgScore.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Pass Rate:</span>
                  <span className="text-sm font-bold text-green-700">{quizStats.passRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Quiz Attempts Section */}
        {studentAttempts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-700">Student Quiz Performance</h2>
              <button
                onClick={() => setShowStudentDetails(!showStudentDetails)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {showStudentDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentAttempts.slice(0, showStudentDetails ? undefined : 6).map((student) => (
                <div 
                  key={student.studentId} 
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-shadow"
                >
                  {/* Student Header */}
                  <div className="flex items-center gap-3 mb-4">
                    {student.studentImage ? (
                      <img 
                        src={student.studentImage} 
                        alt={student.studentName}
                        className="w-12 h-12 rounded-full border-2 border-blue-300 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {student.studentName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{student.studentName}</h3>
                      <p className="text-xs text-gray-500 truncate">{student.studentEmail}</p>
                    </div>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Attempts</p>
                      <p className="text-lg font-bold text-purple-600">{student.totalAttempts}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Avg Score</p>
                      <p className="text-lg font-bold text-blue-600">{student.avgScore.toFixed(1)}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Best Score</p>
                      <p className="text-lg font-bold text-green-600">{student.bestScore.toFixed(1)}%</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">Passed</p>
                      <p className="text-lg font-bold text-emerald-600">{student.passedCount}/{student.totalAttempts}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Overall Progress</span>
                      <span className="text-xs font-semibold text-gray-700">{student.avgScore.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          student.avgScore >= 80 ? 'bg-green-500' :
                          student.avgScore >= 60 ? 'bg-blue-500' :
                          student.avgScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(student.avgScore, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Last Attempt */}
                  {student.lastAttemptDate && (
                    <div className="text-xs text-gray-500 text-center mt-2">
                      Last attempt: {new Date(student.lastAttemptDate).toLocaleDateString()}
                    </div>
                  )}

                  {/* Recent Attempts Details (if expanded) */}
                  {showStudentDetails && student.attempts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Recent Attempts:</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {student.attempts.slice(0, 5).map((attempt) => (
                          <div key={attempt.attemptId} className="bg-white rounded-lg p-2 text-xs">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-gray-700 truncate flex-1">{attempt.quizTitle}</span>
                              <span className={`ml-2 font-bold ${
                                attempt.score >= 80 ? 'text-green-600' :
                                attempt.score >= 60 ? 'text-blue-600' :
                                attempt.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {attempt.score.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-gray-500">
                              <span>{new Date(attempt.submittedAt).toLocaleDateString()}</span>
                              <span className={`px-2 py-0.5 rounded ${
                                attempt.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {attempt.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!showStudentDetails && studentAttempts.length > 6 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowStudentDetails(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View all {studentAttempts.length} students →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyCourses
