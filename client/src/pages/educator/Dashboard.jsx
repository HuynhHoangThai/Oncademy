
import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { dummyDashboardData } from '../../assets/assets';
import Loading from '../../components/students/Loading';
import { assets } from '../../assets/assets';

const Dashboard = () => {
  const { currency } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null)
  const fetchDashboardData = async () => {
    setDashboardData(dummyDashboardData)
  }
  useEffect(() => {
    fetchDashboardData()
  }, [])
  return dashboardData ? (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-5xl flex flex-col gap-10">
        {/* Top Cards */}
        <div className="flex flex-wrap gap-6 justify-center">
          {/* Card 1 */}
          <div className="flex-1 min-w-[220px] max-w-xs bg-white rounded-2xl shadow-xl border-t-4 border-blue-500 p-6 flex items-center gap-4 hover:scale-105 transition-transform duration-200">
            <div className="bg-blue-100 p-3 rounded-full">
              <img src={assets.patients_icon} alt="enrolments" className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-700">{dashboardData.enrolledStudentsData.length}</p>
              <p className="text-base text-gray-500 font-medium">Total Enrolments</p>
            </div>
          </div>
          {/* Card 2 */}
          <div className="flex-1 min-w-[220px] max-w-xs bg-white rounded-2xl shadow-xl border-t-4 border-blue-500 p-6 flex items-center gap-4 hover:scale-105 transition-transform duration-200">
            <div className="bg-blue-100 p-3 rounded-full">
              <img src={assets.appointments_icon} alt="courses" className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-700">{dashboardData.totalCourses}</p>
              <p className="text-base text-gray-500 font-medium">Total Courses</p>
            </div>
          </div>
          {/* Card 3 */}
          <div className="flex-1 min-w-[220px] max-w-xs bg-white rounded-2xl shadow-xl border-t-4 border-blue-500 p-6 flex items-center gap-4 hover:scale-105 transition-transform duration-200">
            <div className="bg-blue-100 p-3 rounded-full">
              <img src={assets.earning_icon} alt="earnings" className="w-8 h-8" />
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-700">{currency}{Math.floor(dashboardData.totalEarnings)}</p>
              <p className="text-base text-gray-500 font-medium">Total Earnings</p>
            </div>
          </div>
        </div>

        {/* Latest Enrolments Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h2 className="pb-4 text-xl font-bold text-blue-700">Latest Enrolments</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-50 text-blue-700">
                <tr>
                  <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold">Course Title</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {dashboardData.enrolledStudentsData.map((item, index) => (
                  <tr key={index} className="border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                    <td className="px-4 py-3 text-center hidden sm:table-cell font-medium text-gray-400">{index + 1}</td>
                    <td className="md:px-4 px-2 py-3 flex items-center gap-3">
                      <img
                        src={item.student.imageUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-blue-200 shadow"
                      />
                      <span className="truncate font-semibold">{item.student.name}</span>
                    </td>
                    <td className="px-4 py-3 truncate font-medium">{item.courseTitle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  ) : <Loading />
}

export default Dashboard