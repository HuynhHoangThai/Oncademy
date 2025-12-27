
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets';
import { useDashboard } from '../../hooks/useDashboard';
import { DashboardSkeleton } from '../../components/students/SkeletonLoader';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { currency } = useContext(AppContext);
  const { data, isLoading, error, refetch, isFetching } = useDashboard();

  const dashboardData = data?.dashboardData;

  const handleManualRefresh = async () => {
    await refetch();
    toast.success('Dashboard refreshed successfully');
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading dashboard: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!dashboardData) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl flex flex-col gap-10">
        {/* Header with Refresh Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">Educator Dashboard</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleManualRefresh}
              disabled={isFetching}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all w-full sm:w-auto ${isFetching
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                }`}
            >
              <svg
                className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Top Cards */}
        <div className="flex flex-wrap gap-6 justify-center">
          {/* Card 1 - Total Enrollments */}
          <div className="flex-1 min-w-[220px] max-w-xs bg-white rounded-2xl shadow-xl border-t-4 border-blue-500 p-6 flex items-center gap-4 hover:scale-105 transition-transform duration-200">
            <div className="bg-blue-100 p-3 rounded-full">
              <img src={assets.patients_icon} alt="enrolments" className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-700">{dashboardData.totalEnrollments || 0}</p>
              <p className="text-base text-gray-500 font-medium">Total Students</p>
            </div>
          </div>
          {/* Card 2 - Total Courses */}
          <div className="flex-1 min-w-[220px] max-w-xs bg-white rounded-2xl shadow-xl border-t-4 border-green-500 p-6 flex items-center gap-4 hover:scale-105 transition-transform duration-200">
            <div className="bg-green-100 p-3 rounded-full">
              <img src={assets.appointments_icon} alt="courses" className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-700">{dashboardData.totalCourses || 0}</p>
              <p className="text-base text-gray-500 font-medium">Total Courses</p>
            </div>
          </div>
          {/* Card 3 - Total Earnings */}
          <div className="flex-1 min-w-[220px] max-w-xs bg-white rounded-2xl shadow-xl border-t-4 border-purple-500 p-6 flex items-center gap-4 hover:scale-105 transition-transform duration-200">
            <div className="bg-purple-100 p-3 rounded-full">
              <img src={assets.earning_icon} alt="earnings" className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-700">{currency}{Math.floor(dashboardData.totalEarnings || 0)}</p>
              <p className="text-base text-gray-500 font-medium">Total Earnings</p>
            </div>
          </div>
          {/* Card 4 - Total Purchases */}
          <div className="flex-1 min-w-[220px] max-w-xs bg-white rounded-2xl shadow-xl border-t-4 border-orange-500 p-6 flex items-center gap-4 hover:scale-105 transition-transform duration-200">
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-700">{dashboardData.totalPurchases || 0}</p>
              <p className="text-base text-gray-500 font-medium">Total Purchases</p>
            </div>
          </div>
        </div>

        {/* Top Performing Courses */}
        {dashboardData.topCourses && dashboardData.topCourses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h2 className="pb-4 text-xl font-bold text-blue-700">Top Performing Courses</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-50 text-blue-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-left">Course Title</th>
                    <th className="px-4 py-3 font-semibold text-center">Sales</th>
                    <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {dashboardData.topCourses.map((course, index) => (
                    <tr key={index} className="border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                      <td className="px-4 py-3 font-medium">{course.courseTitle}</td>
                      <td className="px-4 py-3 text-center">{course.purchaseCount}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">{currency}{Math.floor(course.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly Earnings Chart */}
        {dashboardData.monthlyEarnings && dashboardData.monthlyEarnings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h2 className="pb-4 text-xl font-bold text-blue-700">Monthly Earnings (Last 6 Months)</h2>
            <div className="flex items-end justify-between gap-2 h-64">
              {dashboardData.monthlyEarnings.map((item, index) => {
                const maxEarning = Math.max(...dashboardData.monthlyEarnings.map(e => e.earnings));
                const height = maxEarning > 0 ? (item.earnings / maxEarning) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-semibold text-gray-600">{currency}{Math.floor(item.earnings)}</div>
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-400"
                      style={{ height: `${height}%`, minHeight: item.earnings > 0 ? '20px' : '0' }}
                      title={`${item.month}: ${currency}${item.earnings}`}
                    ></div>
                    <div className="text-xs text-gray-500 font-medium text-center">{item.month.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Course Statistics */}
        {dashboardData.courseStats && dashboardData.courseStats.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h2 className="pb-4 text-xl font-bold text-blue-700">All Courses Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.courseStats.map((course, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    {course.courseThumbnail && (
                      <img
                        src={course.courseThumbnail}
                        alt={course.courseTitle}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{course.courseTitle}</h3>
                      <p className="text-xs text-gray-500 mt-1">{currency}{course.coursePrice}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        <span className="font-semibold">{course.enrolledCount}</span> enrolled
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Enrolments Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h2 className="pb-4 text-xl font-bold text-blue-700">Latest Enrollments</h2>
          <div className="overflow-x-auto">
            {dashboardData.recentEnrollments && dashboardData.recentEnrollments.length > 0 ? (
              <table className="min-w-full text-sm">
                <thead className="bg-blue-50 text-blue-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
                    <th className="px-4 py-3 font-semibold text-left">Student</th>
                    <th className="px-4 py-3 font-semibold text-left">Course</th>
                    <th className="px-4 py-3 font-semibold text-right hidden md:table-cell">Amount</th>
                    <th className="px-4 py-3 font-semibold text-right hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {dashboardData.recentEnrollments.slice(0, 10).map((item, index) => (
                    <tr key={index} className="border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                      <td className="px-4 py-3 text-center hidden sm:table-cell font-medium text-gray-400">{index + 1}</td>
                      <td className="md:px-4 px-2 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.studentImage || assets.profile_img}
                            alt="Profile"
                            className="w-10 h-10 rounded-full border-2 border-blue-200 shadow"
                          />
                          <div>
                            <p className="font-semibold text-sm">{item.studentName}</p>
                            <p className="text-xs text-gray-500 hidden sm:block">{item.studentEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.courseThumbnail && (
                            <img
                              src={item.courseThumbnail}
                              alt={item.courseTitle}
                              className="w-10 h-10 rounded object-cover hidden md:block"
                            />
                          )}
                          <span className="font-medium text-sm line-clamp-2">{item.courseTitle}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600 hidden md:table-cell">
                        {currency}{item.amount || 0}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500 hidden lg:table-cell">
                        {new Date(item.enrolledAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="mt-4 text-gray-500">No enrollments yet</p>
                <p className="text-sm text-gray-400">Students will appear here after purchasing your courses</p>
              </div>
            )}
          </div>
        </div>

        {/* All Enrolled Students */}
        {dashboardData.enrolledStudents && dashboardData.enrolledStudents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h2 className="pb-4 text-xl font-bold text-blue-700">All Enrolled Students ({dashboardData.enrolledStudents.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {dashboardData.enrolledStudents.slice(0, 20).map((student, index) => (
                <div key={index} className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <img
                    src={student.imageUrl || assets.profile_img}
                    alt={student.name}
                    className="w-16 h-16 rounded-full border-2 border-blue-300 mb-2"
                  />
                  <p className="font-semibold text-sm text-center line-clamp-1">{student.name}</p>
                  <p className="text-xs text-gray-500 text-center line-clamp-1">{student.email}</p>
                </div>
              ))}
            </div>
            {dashboardData.enrolledStudents.length > 20 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                + {dashboardData.enrolledStudents.length - 20} more students
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard