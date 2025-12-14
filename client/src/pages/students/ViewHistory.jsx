import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import CourseCard from '../../components/students/CourseCard';
import { Link } from 'react-router-dom';

const ViewHistory = () => {
  const { allCourses, viewHistory, clearViewHistory } = useContext(AppContext);
  
  // Get courses from view history
  const historyList = viewHistory
    .map(item => {
      const course = allCourses.find(course => course._id === item.courseId);
      return course ? { ...course, viewDate: item.viewDate, timestamp: item.timestamp } : null;
    })
    .filter(Boolean);

  return (
    <>
      <div className="bg-gradient-to-b from-cyan-100/70 to-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-gray-800">View History</h1>
              <p className="text-gray-600">Courses you've recently viewed</p>
            </div>
            {historyList.length > 0 && (
              <button
                onClick={clearViewHistory}
                className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="min-h-screen bg-gray-50 -mt-4">
        <div className="max-w-7xl mx-auto py-10 px-4">
          {historyList.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-6">
                <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No view history yet</h3>
              <p className="text-gray-500 mb-6">Start browsing courses to build your view history!</p>
              <Link 
                to="/courses" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600">{historyList.length} course{historyList.length !== 1 ? 's' : ''} in your history</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {historyList.map(course => (
                  <div key={`${course._id}-${course.timestamp}`} className="relative">
                    <CourseCard course={course} />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Viewed: {course.viewDate}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewHistory;
