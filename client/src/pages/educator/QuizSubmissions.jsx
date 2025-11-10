import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/students/Loading';

const QuizSubmissions = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    filterSubmissions();
    // eslint-disable-next-line
  }, [filterStatus, searchTerm, submissions]);

  const fetchSubmissions = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/quiz/${quizId}/submissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setQuiz(data.quiz);
        setSubmissions(data.submissions || []);
      } else {
        toast.error(data.message || 'Failed to load submissions');
        navigate('/educator/quizzes');
      }
    } catch (error) {
      console.error('Fetch submissions error:', error);
      toast.error('Failed to load submissions');
      navigate('/educator/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(sub => sub.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(sub => 
        sub.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubmissions(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'completed': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'graded': 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-gray-100 text-gray-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const calculateStats = () => {
    if (submissions.length === 0) return { avg: 0, highest: 0, lowest: 0, passRate: 0 };

    const gradedSubmissions = submissions.filter(s => s.status === 'completed' || s.status === 'graded');
    if (gradedSubmissions.length === 0) return { avg: 0, highest: 0, lowest: 0, passRate: 0 };

    const scores = gradedSubmissions.map(s => s.scoring?.scorePercentage || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passed = gradedSubmissions.filter(s => s.scoring?.passed).length;
    const passRate = (passed / gradedSubmissions.length) * 100;

    return { avg, highest, lowest, passRate };
  };

  const stats = calculateStats();

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/educator/quizzes')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Quizzes
          </button>
          <h1 className="text-3xl font-bold text-blue-700">Quiz Submissions</h1>
          <p className="text-gray-600 mt-1">{quiz?.quizTitle}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Submissions</p>
            <p className="text-3xl font-bold text-blue-700">{submissions.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-purple-700">{stats.avg.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Highest Score</p>
            <p className="text-3xl font-bold text-green-700">{stats.highest.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
            <p className="text-3xl font-bold text-orange-700">{stats.passRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by student name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending Grading</option>
              <option value="graded">Graded</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">No submissions found</p>
              <p className="text-gray-400 text-sm">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Students haven\'t submitted this quiz yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-blue-50 text-blue-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Student</th>
                    <th className="px-4 py-3 text-center font-semibold hidden md:table-cell">Attempt #</th>
                    <th className="px-4 py-3 text-center font-semibold">Score</th>
                    <th className="px-4 py-3 text-center font-semibold hidden lg:table-cell">Time Spent</th>
                    <th className="px-4 py-3 text-center font-semibold hidden sm:table-cell">Submitted</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission._id} className="border-b last:border-b-0 border-gray-100 hover:bg-blue-50 transition">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold">{submission.studentName || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{submission.studentEmail || submission.studentId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        #{submission.attemptNumber}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {submission.status === 'completed' || submission.status === 'graded' ? (
                          <div>
                            <p className="font-bold text-lg">{submission.scoring?.scorePercentage?.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">
                              {submission.scoring?.pointsEarned}/{submission.scoring?.totalPoints} pts
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {submission.timeSpent 
                          ? `${Math.floor(submission.timeSpent / 60)}m ${submission.timeSpent % 60}s`
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-center text-sm hidden sm:table-cell">
                        {submission.submittedAt 
                          ? new Date(submission.submittedAt).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(submission.status)}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/educator/quiz/grade/${submission._id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View/Grade"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
      </div>
    </div>
  );
};

export default QuizSubmissions;
