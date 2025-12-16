import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/students/Loading';
import { Check, X } from 'lucide-react';

const QuizResult = () => {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const fetchResult = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/quiz/attempt/${attemptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setResult(data.attempt);
      } else {
        toast.error(data.message || 'Failed to load results');
        navigate(-1);
      }
    } catch (error) {
      console.error('Fetch result error:', error);
      toast.error('Failed to load results');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [attemptId, getToken, backendUrl, navigate]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  if (loading) return <Loading />;
  if (!result) return null;

  const detailedResults = result.detailedResults;
  const isPending = result.status === 'pending';
  const scorePercentage = result.scoring?.scorePercentage || 0;
  const passed = result.scoring?.passed;
  const totalPoints = result.scoring?.totalPoints || 0;
  const pointsEarned = result.scoring?.pointsEarned || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Results</h1>
          <p className="text-gray-600">Attempt #{result.attemptNumber}</p>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border border-gray-200">
          {isPending ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-yellow-700 mb-2">Pending Grading</h2>
              <p className="text-gray-600 mb-4">
                Your quiz contains essay questions that require manual grading by the instructor.
              </p>
              <p className="text-sm text-gray-500">
                You will be notified once your quiz has been graded.
              </p>
            </div>
          ) : (
            <div className="text-center">
              {/* Score Circle with Badge */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mb-6">
                {/* Score Circle */}
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-56 h-56 transform -rotate-90">
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="112"
                      cy="112"
                      r="100"
                      stroke={passed ? '#10b981' : scorePercentage >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 100}`}
                      strokeDashoffset={`${2 * Math.PI * 100 * (1 - scorePercentage / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-6xl font-bold ${passed ? 'text-green-600' : scorePercentage >= 50 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                      {scorePercentage.toFixed(0)}%
                    </span>
                    <span className="text-gray-500 text-base mt-2">Score</span>
                  </div>
                </div>

                {/* Pass/Fail Badge */}
                <div className={`px-8 py-4 rounded-full shadow-lg ${passed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  <div className="flex items-center gap-3">
                    {passed ? (
                      <>
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold text-2xl">Passed!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold text-2xl">Not Passed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Score Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-md">
                  <p className="text-sm text-blue-600 font-medium mb-2">Points Earned</p>
                  <p className="text-4xl font-bold text-blue-700">
                    {pointsEarned} <span className="text-2xl text-blue-500">/ {totalPoints}</span>
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-md">
                  <p className="text-sm text-purple-600 font-medium mb-2">Percentage</p>
                  <p className="text-4xl font-bold text-purple-700">
                    {scorePercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submission Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Submission Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Submitted At:</p>
              <p className="font-medium text-gray-800">
                {new Date(result.submittedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Time Spent:</p>
              <p className="font-medium text-gray-800">
                {Math.floor(result.timeSpent / 60)} min {result.timeSpent % 60} sec
              </p>
            </div>
            <div>
              <p className="text-gray-600">Attempt Number:</p>
              <p className="font-medium text-gray-800">#{result.attemptNumber}</p>
            </div>
            <div>
              <p className="text-gray-600">Status:</p>
              <p className="font-medium text-gray-800 capitalize">{result.status}</p>
            </div>
          </div>
        </div>

        {!isPending && detailedResults && detailedResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Question Review
            </h2>
            <div className="space-y-6">
              {detailedResults.map((result, index) => (
                <div
                  key={result.questionId}
                  className={`border-2 rounded-xl p-5 shadow-md ${result.isCorrect === true
                    ? 'border-green-400 bg-green-50'
                    : result.isCorrect === false
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-400 bg-gray-50'
                    }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-800">Question {index + 1}</h3>
                    <div className="flex items-center gap-2">
                      {result.isCorrect === true && (
                        <span className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                          <Check size={16} /> Correct ({result.pointsEarned || 0} pts)
                        </span>
                      )}
                      {result.isCorrect === false && (
                        <span className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                          <X size={16} /> Incorrect (0 pts)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="bg-white rounded-lg p-4 mb-4 border border-gray-300">
                    <p className="text-gray-800 font-medium">{result.questionText}</p>
                  </div>

                  {/* Answer Options (if available) */}
                  {result.correctAnswerData?.correctOptions && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Answer Options:</p>
                      <div className="space-y-2">
                        {result.correctAnswerData.correctOptions.map((option, optIndex) => {
                          const isCorrect = option.isCorrect;
                          const isUserAnswer = result.userAnswer === option.optionText;

                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border-2 flex items-start gap-2 ${isCorrect
                                  ? 'border-green-500 bg-green-100'
                                  : isUserAnswer
                                    ? 'border-red-500 bg-red-100'
                                    : 'border-gray-300 bg-white'
                                }`}
                            >
                              {isCorrect ? (
                                <Check className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
                              ) : isUserAnswer ? (
                                <X className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex-shrink-0 mt-0.5"></div>
                              )}
                              <div className="flex-1">
                                <p className={`${isCorrect ? 'font-bold text-green-800' : isUserAnswer ? 'font-semibold text-red-800' : 'text-gray-700'}`}>
                                  {option.optionText}
                                </p>
                                {isCorrect && (
                                  <span className="text-xs text-green-700 font-medium">✓ Correct Answer</span>
                                )}
                                {isUserAnswer && !isCorrect && (
                                  <span className="text-xs text-red-700 font-medium">✗ Your Answer</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* User Answer (for non-MC questions) */}
                  {!result.correctAnswerData?.correctOptions && (
                    <div className={`p-4 rounded-lg border-2 mb-4 ${result.isCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Your Answer:</p>
                      <p className={`font-medium ${result.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {result.userAnswer || 'No Answer'}
                      </p>
                    </div>
                  )}

                  {/* Correct Answer for Fill-in-the-blank */}
                  {!result.correctAnswerData?.correctOptions && result.correctAnswerData?.correctAnswers && (
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-400 mb-4">
                      <p className="text-sm font-semibold text-blue-800 mb-1">Correct Answer(s):</p>
                      <p className="text-blue-900 font-medium">
                        {result.correctAnswerData.correctAnswers.join(' OR ')}
                      </p>
                    </div>
                  )}

                  {/* Explanation */}
                  {result.explanation && (
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                      <p className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Explanation:
                      </p>
                      <p className="text-gray-700 leading-relaxed">{result.explanation}</p>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-2)}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Course
          </button>
          {!passed && !isPending && (
            <button
              onClick={() => navigate(`/quiz/${quizId}`)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Retake Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
