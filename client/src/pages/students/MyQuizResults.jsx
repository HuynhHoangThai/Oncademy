import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/students/Loading';

const MyQuizResults = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'score', 'course'

  useEffect(() => {
    fetchMyAttempts();
    // eslint-disable-next-line
  }, []);

  const fetchMyAttempts = async () => {
    try {
      const token = await getToken();

      const { data } = await axios.get(
        `${backendUrl}/api/quiz/my-attempts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setAttempts(data.attempts || []);
      } else {
        toast.error(data.message || 'Failed to load quiz attempts');
      }
    } catch (error) {
      console.error('Fetch attempts error:', error);
      toast.error('Failed to load quiz attempts');
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = attempts.filter(attempt => {
    // Filter by status
    if (filterStatus !== 'all' && attempt.status !== filterStatus) {
      return false;
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        attempt.quizTitle?.toLowerCase().includes(term) ||
        attempt.courseTitle?.toLowerCase().includes(term) ||
        attempt.pathwayTitle?.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Group attempts by course or pathway
  const attemptsByCourse = filteredAttempts.reduce((acc, attempt) => {
    // Create a unique key for grouping
    let groupKey;
    let groupTitle;
    let isPathway = attempt.sourceType === 'pathway';

    if (isPathway && attempt.pathwayTitle) {
      groupKey = `pathway_${attempt.pathwayTitle}`;
      groupTitle = attempt.pathwayTitle;
    } else {
      groupKey = `course_${attempt.courseTitle || 'Unknown Course'}`;
      groupTitle = attempt.courseTitle || 'Unknown Course';
    }

    if (!acc[groupKey]) {
      acc[groupKey] = {
        title: groupTitle,
        isPathway: isPathway,
        attempts: []
      };
    }
    acc[groupKey].attempts.push(attempt);
    return acc;
  }, {});

  // Sort courses/pathways alphabetically or by average score
  const sortedCourses = Object.keys(attemptsByCourse).sort((keyA, keyB) => {
    if (sortBy === 'score') {
      // Calculate average score for each group
      const getAvgScore = (key) => {
        const group = attemptsByCourse[key];
        const completedAttempts = group.attempts.filter(
          a => (a.status === 'completed' || a.status === 'graded') && a.scoring
        );
        if (completedAttempts.length === 0) return 0;
        return completedAttempts.reduce((sum, a) => sum + (a.scoring?.scorePercentage || 0), 0) / completedAttempts.length;
      };
      return getAvgScore(keyB) - getAvgScore(keyA); // Highest first
    } else {
      // Sort pathways first, then alphabetically
      const groupA = attemptsByCourse[keyA];
      const groupB = attemptsByCourse[keyB];
      if (groupA.isPathway !== groupB.isPathway) {
        return groupA.isPathway ? -1 : 1; // Pathways first
      }
      return groupA.title.localeCompare(groupB.title); // Then alphabetically
    }
  });

  // Sort attempts within each group
  sortedCourses.forEach(key => {
    attemptsByCourse[key].attempts.sort((a, b) => {
      if (sortBy === 'score') {
        // Sort by score (highest first)
        const scoreA = a.scoring?.scorePercentage || 0;
        const scoreB = b.scoring?.scorePercentage || 0;
        return scoreB - scoreA;
      } else {
        // Sort by date (most recent first)
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      }
    });
  });

  const getStatusBadge = (status) => {
    const badges = {
      'completed': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'graded': 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-gray-100 text-gray-700'
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateStats = () => {
    const completed = attempts.filter(a => a.status === 'completed' || a.status === 'graded');
    if (completed.length === 0) return { totalAttempts: 0, avgScore: 0, passedCount: 0, passRate: 0 };

    const totalAttempts = completed.length;
    const avgScore = completed.reduce((sum, a) => sum + (a.scoring?.scorePercentage || 0), 0) / totalAttempts;
    const passedCount = completed.filter(a => a.scoring?.passed).length;
    const passRate = (passedCount / totalAttempts) * 100;

    return { totalAttempts, avgScore, passedCount, passRate };
  };

  const stats = calculateStats();

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-700">My Quiz Results</h1>
          <p className="text-gray-600 mt-1">View your quiz history and scores</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
            <p className="text-3xl font-bold text-blue-700">{stats.totalAttempts}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-purple-700">{stats.avgScore.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Quizzes Passed</p>
            <p className="text-3xl font-bold text-green-700">{stats.passedCount}</p>
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
                placeholder="Search by quiz or course name..."
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
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Sort: Recent First</option>
              <option value="score">Sort: Highest Score</option>
            </select>
          </div>
        </div>

        {/* Quiz Attempts List */}
        {filteredAttempts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
            <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">No quiz attempts found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Start taking quizzes to see your results here'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Group by Course/Pathway */}
            {sortedCourses.map((groupKey) => {
              const group = attemptsByCourse[groupKey];
              return (
                <div key={groupKey} className="space-y-4">
                  {/* Group Header */}
                  <div className={`flex items-center gap-3 pb-3 border-b-2 ${group.isPathway ? 'border-purple-200' : 'border-blue-200'}`}>
                    <div className={`${group.isPathway ? 'bg-purple-600' : 'bg-blue-600'} text-white p-2 rounded-lg`}>
                      {group.isPathway ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-800">{group.title}</h2>
                        {group.isPathway && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Combo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {group.attempts.length} quiz attempt{group.attempts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{group.isPathway ? 'Combo' : 'Course'} Average</p>
                      <p className={`text-2xl font-bold ${group.isPathway ? 'text-purple-700' : 'text-blue-700'}`}>
                        {(() => {
                          const completedAttempts = group.attempts.filter(
                            a => (a.status === 'completed' || a.status === 'graded') && a.scoring
                          );
                          if (completedAttempts.length === 0) return 'N/A';
                          const avg = completedAttempts.reduce(
                            (sum, a) => sum + (a.scoring?.scorePercentage || 0),
                            0
                          ) / completedAttempts.length;
                          return `${avg.toFixed(1)}%`;
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Quiz Attempts for this Group */}
                  <div className="space-y-3 pl-4">
                    {group.attempts.map((attempt) => (
                      <div
                        key={attempt._id}
                        className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => navigate(`/quiz/${attempt.quizId}/result/${attempt._id}`)}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          {/* Left: Quiz Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">
                                  {attempt.quizTitle || 'Unknown Quiz'}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <span>Attempt #{attempt.attemptNumber}</span>
                                  <span className="text-gray-300">•</span>
                                  <span>{new Date(attempt.submittedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}</span>
                                  {attempt.timeSpent && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <span>{Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(attempt.status)}`}>
                                {attempt.status}
                              </span>
                            </div>
                          </div>

                          {/* Right: Score Display */}
                          {(attempt.status === 'completed' || attempt.status === 'graded') && attempt.scoring ? (
                            <div className="flex items-center gap-6">
                              {/* Score Percentage */}
                              <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Score</p>
                                <p className={`text-4xl font-bold ${getScoreColor(attempt.scoring.scorePercentage)}`}>
                                  {attempt.scoring.scorePercentage.toFixed(1)}%
                                </p>
                              </div>

                              {/* Points */}
                              <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Points</p>
                                <p className="text-2xl font-bold text-gray-700">
                                  {attempt.scoring.pointsEarned}/{attempt.scoring.totalPoints}
                                </p>
                              </div>

                              {/* Pass/Fail Badge */}
                              <div className="text-center">
                                {attempt.scoring.passed ? (
                                  <div className="flex flex-col items-center">
                                    <svg className="w-12 h-12 text-green-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-semibold text-green-700">Passed</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <svg className="w-12 h-12 text-red-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-semibold text-red-700">Failed</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : attempt.status === 'pending' ? (
                            <div className="text-center px-6 py-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <svg className="w-12 h-12 text-yellow-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm font-semibold text-yellow-800">Awaiting Grading</p>
                              <p className="text-xs text-yellow-600 mt-1">Essay questions being reviewed</p>
                            </div>
                          ) : null}
                        </div>

                        {/* View Details Link */}
                        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                            View Details
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyQuizResults;
