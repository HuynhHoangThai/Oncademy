import React, {useEffect, useState } from 'react'
import { dummyStudentEnrolled } from '../../assets/assets'
import Loading from '../../components/students/Loading'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'

const StudentsEnrolled = () => {

  const {backendUrl, getToken, isEducator} = useContext(AppContext);
  const [enrolledStudents, setEnrolledStudents] = useState([null])
  
  const fetchEnrolledStudents = async () => {
    try {
      const token = await getToken();
      const {data} = await axios.get(backendUrl + '/api/educator/enrolled-students',
        {headers: {Authorization: `Bearer ${token}`}})
    
      if(data.success) {
        setEnrolledStudents(data.enrolledStudents.reverse());
      }else {
        toast.error(data.message);
      }

      } catch (error) {
        toast.error(error.message);
    }
  }

  useEffect(() => {
    if(isEducator){
      fetchEnrolledStudents()
    }
  }, [isEducator])


  if (!enrolledStudents) return <Loading />;

  const filteredStudents = enrolledStudents.filter(item => item && item.student);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start md:p-8 p-4 pt-8 bg-gray-50">
      <div className="flex flex-col items-center max-w-4xl w-full overflow-x-auto rounded-xl bg-white border border-gray-200 shadow-lg">
        <table className="w-full table-auto">
          <thead className="sticky top-0 bg-white z-10 text-gray-900 border-b border-gray-200 text-sm text-left shadow-sm">
            <tr>
              <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
              <th className="px-4 py-3 font-semibold">Student Name</th>
              <th className="px-4 py-3 font-semibold">Course Title</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No students enrolled yet.</td>
              </tr>
            ) : (
              filteredStudents.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-100 transition-colors duration-150 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50`}
                >
                  <td className="px-4 py-3 text-center hidden sm:table-cell font-medium text-gray-500">{index + 1}</td>
                  <td className="md:px-4 px-2 py-3 flex items-center gap-3">
                    <img
                      src={item.student.imageUrl}
                      alt={item.student.name}
                      className="w-10 h-10 rounded-full border border-gray-200 shadow-sm"
                    />
                    <span className="truncate font-semibold text-gray-800">{item.student.name}</span>
                  </td>
                  <td className="px-4 py-3 truncate font-medium text-gray-700">{item.courseTitle}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentsEnrolled
