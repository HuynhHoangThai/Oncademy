import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../../components/students/Loading'

const StudentsEnrolled = () => {
  const { getToken } = useAuth()
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  // Fetch enrolled students từ API
  const fetchEnrolledStudents = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/educator/enrolled-students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        setEnrolledStudents(data.enrolledStudents || [])
      }
    } catch (error) {
      console.error('Error fetching enrolled students:', error)
      toast.error('Failed to load enrolled students')
    }
  }

  // Fetch dashboard data để lấy total revenue chính xác
  const fetchDashboardData = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/educator/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        setDashboardData(data.dashboardData)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load all data
  const loadAllData = async () => {
    await Promise.all([
      fetchEnrolledStudents(),
      fetchDashboardData()
    ])
  }

  // Sync dashboard để cập nhật dữ liệu mới nhất
  const syncData = async () => {
    try {
      setSyncing(true)
      const token = await getToken()
      await axios.post(`${backendUrl}/api/educator/dashboard/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Fetch lại data sau khi sync
      await loadAllData()
      toast.success('Data synced successfully')
    } catch (error) {
      console.error('Error syncing data:', error)
      toast.error('Failed to sync data')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadAllData()
    
    // Auto-refresh khi tab visible và mỗi 5 phút
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAllData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAllData()
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <Loading />

  const filteredStudents = enrolledStudents.filter(item => item && item.student)

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 pt-8 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl w-full flex flex-col gap-6">
        {/* Header with Sync Button and Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">Enrolled Students</h1>
            <p className="text-gray-600 mt-1">Total: {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={syncData}
            disabled={syncing}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all w-full lg:w-auto ${
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

        {/* Students Table */}
        <div className="overflow-x-auto rounded-xl bg-white border border-gray-200 shadow-xl">
          <table className="w-full table-auto">
            <thead className="sticky top-0 bg-blue-50 z-10 text-blue-700 border-b border-blue-200 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold text-center hidden md:table-cell">Amount</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Enrolled Date</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-gray-400 text-lg font-medium">No students enrolled yet</p>
                      <p className="text-gray-300 text-sm mt-1">Students will appear here after purchasing your courses</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-100 transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-blue-50`}
                  >
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                        {index + 1}
                      </span>
                    </td>
                    <td className="md:px-4 px-2 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.student?.imageUrl || '/default-avatar.png'}
                          alt={item.student?.name || 'Student'}
                          className="w-10 h-10 rounded-full border-2 border-blue-200 shadow-sm object-cover"
                          onError={(e) => { e.target.src = '/default-avatar.png' }}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{item.student?.name || 'Unknown'}</span>
                          {item.student?.email && (
                            <span className="text-xs text-gray-500 hidden lg:block">{item.student.email}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-700 line-clamp-2">{item.courseTitle || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                        ${item.amount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-gray-700">{new Date(item.purchaseDate).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-400">{new Date(item.purchaseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Cards */}
        {filteredStudents.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm">Total Students</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-700">
                    {dashboardData?.totalEnrollments || filteredStudents.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm">Total Courses</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-700">
                    {dashboardData?.totalCourses || new Set(filteredStudents.map(s => s.courseTitle)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-orange-100 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm">Total Purchases</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-700">
                    {dashboardData?.totalPurchases || filteredStudents.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-700">
                    ${dashboardData?.totalEarnings?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentsEnrolled
