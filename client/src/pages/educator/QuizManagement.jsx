import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/students/Loading';

const QuizManagement = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  useEffect(() => {
    fetchCoursesAndQuizzes();
    // eslint-disable-next-line
  }, []);

  const fetchCoursesAndQuizzes = async () => {
    try {
      const token = await getToken();
      
      // Fetch educator's courses
      const { data: coursesData } = await axios.get(`${backendUrl}/api/educator/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (coursesData.success) {
        setCourses(coursesData.courses || []);
        
        // Fetch all quizzes for all courses
        const allQuizzes = [];
        for (const course of coursesData.courses || []) {
          try {
            const { data: quizData } = await axios.get(`${backendUrl}/api/quiz/course/${course._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (quizData.success) {
              // Add course info to each quiz
              const quizzesWithCourse = quizData.quizzes.map(quiz => ({
                ...quiz,
                courseName: course.courseTitle
              }));
              allQuizzes.push(...quizzesWithCourse);
            }
          } catch (error) {
            console.error(`Error fetching quizzes for course ${course._id}:`, error);
          }
        }
        setQuizzes(allQuizzes);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManual = () => {
    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }
    navigate(`/educator/quiz/create/${selectedCourse}`);
  };

  const handleUploadExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedCourse) {
      toast.error('Please select a course first');
      e.target.value = '';
      return;
    }

    try {
      setUploadingExcel(true);
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', selectedCourse);

      const { data } = await axios.post(
        `${backendUrl}/api/quiz/upload-excel`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (data.success) {
        toast.success(data.message);
        setShowCreateModal(false);
        setSelectedCourse(null);
        fetchCoursesAndQuizzes();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Upload Excel error:', error);
      toast.error(error?.response?.data?.message || 'Failed to upload Excel file');
    } finally {
      setUploadingExcel(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDownloadTemplate = () => {
    window.open(`${backendUrl}/api/quiz/template/download`, '_blank');
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const token = await getToken();
      const { data } = await axios.delete(`${backendUrl}/api/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success('Quiz deleted successfully');
        fetchCoursesAndQuizzes();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Delete quiz error:', error);
      toast.error('Failed to delete quiz');
    }
  };

  const handleTogglePublish = async (quizId) => {
    try {
      const token = await getToken();
      const { data } = await axios.patch(
        `${backendUrl}/api/quiz/${quizId}/publish`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (data.success) {
        toast.success(data.message);
        fetchCoursesAndQuizzes();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
      toast.error('Failed to update quiz status');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">Quiz Management</h1>
            <p className="text-gray-600 mt-1">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Quiz
          </button>
        </div>

        {/* Quiz List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6">
          {quizzes.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">No quizzes yet</p>
              <p className="text-gray-400 text-sm mb-6">Create your first quiz to assess student learning</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Create Quiz
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-blue-50 text-blue-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Quiz Title</th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Course</th>
                    <th className="px-4 py-3 text-center font-semibold hidden md:table-cell">Type</th>
                    <th className="px-4 py-3 text-center font-semibold hidden sm:table-cell">Questions</th>
                    <th className="px-4 py-3 text-center font-semibold hidden xl:table-cell">Duration</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {quizzes.map((quiz) => (
                    <tr key={quiz._id} className="border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold">{quiz.quizTitle}</p>
                          <p className="text-xs text-gray-500">{quiz.quizDescription?.slice(0, 50)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-sm text-gray-700">{quiz.courseName || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          quiz.quizType === 'final-exam' ? 'bg-red-100 text-red-700' :
                          quiz.quizType === 'assignment' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {quiz.quizType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {quiz.questions?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-center hidden xl:table-cell">
                        {quiz.duration} min
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePublish(quiz._id)}
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            quiz.isPublished
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {quiz.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/educator/quiz/edit/${quiz._id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => navigate(`/educator/quiz/submissions/${quiz._id}`)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                            title="View Submissions"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(quiz._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Quiz Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-700">Create New Quiz</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedCourse(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Course Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCourse || ''}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">-- Choose a course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.courseTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Manual Builder */}
                <button
                  onClick={handleCreateManual}
                  disabled={!selectedCourse}
                  className={`group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-6 transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    !selectedCourse ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white bg-opacity-20 rounded-full">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Manual Builder</h3>
                      <p className="text-sm text-blue-100">Create questions one by one</p>
                    </div>
                  </div>
                </button>

                {/* Excel Upload */}
                <div className={`group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl p-6 transition-all duration-300 shadow-lg ${
                  !selectedCourse ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  <label className={`flex flex-col items-center gap-4 h-full ${selectedCourse ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <div className="p-4 bg-white bg-opacity-20 rounded-full">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-lg mb-1">Upload Excel</h3>
                      <p className="text-sm text-green-100">Import from Excel file</p>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleUploadExcel}
                      className="hidden"
                      disabled={uploadingExcel || !selectedCourse}
                    />
                  </label>
                  {uploadingExcel && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      Need help with Excel format?
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Excel Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizManagement;
