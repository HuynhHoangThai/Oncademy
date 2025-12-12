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

        {/* Question Review */}
        {!isPending && result.answers && result.answers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Question Review</h2>
            <div className="space-y-4">
              {result.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 ${answer.isCorrect === true
                    ? 'border-green-300 bg-green-50'
                    : answer.isCorrect === false
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-gray-50'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">
                      Question {index + 1}
                    </h3>
                    <div className="flex items-center gap-2">
                      {answer.isCorrect === true && (
                        <span className="text-green-600 font-semibold">
                          <Check className="inline-block mr-1" size={16} /> Correct ({answer.pointsEarned} pts)
                        </span>
                      )}
                      {answer.isCorrect === false && (
                        <span className="text-red-600 font-semibold">
                          <X className="inline-block mr-1" size={16} /> Incorrect (0 pts)
                        </span>
                      )}
                      {answer.isCorrect === null && (
                        <span className="text-gray-600 font-semibold">
                          Manual Grading Required
                        </span>
                      )}
                    </div>
                  </div>

                  {answer.feedback && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                      <p className="font-semibold text-blue-800 mb-1">Feedback:</p>
                      <p className="text-blue-700">{answer.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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
            <h2 className="text-xl font-bold text-gray-800 mb-4">Question Review (Q&A)</h2>
            <div className="space-y-6">
              {detailedResults.map((result, index) => (
                <div
                  key={result.questionId}
                  className={`border-l-4 p-4 rounded-r-lg shadow-sm ${result.isCorrect === true
                    ? 'border-green-500 bg-green-50'
                    : result.isCorrect === false
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-500 bg-gray-50'
                    }`}
                >
                  {/* Question */}
                  <p className="font-semibold text-gray-800 mb-2">Question {index + 1}: {result.questionText}</p>

                  {/* User Answer */}
                  <div className="bg-white rounded-lg p-3 mb-2 border border-gray-200">
                    <p className={`text-sm font-medium ${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      Your Answer: <span className="font-bold">{result.userAnswer || 'No Answer'}</span>
                      {result.isCorrect ? <><Check className="inline-block mx-1" size={14} />(Correct)</> : <><X className="inline-block mx-1" size={14} />(Incorrect)</>}
                    </p>
                  </div>

                  {/* Correct Answer (Conditional Display) */}
                  {result.correctAnswerData && (
                    <div className="mt-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                      <p className="font-semibold mb-1">Correct Answer:</p>

                      {/* Handling MC/TrueFalse/Fill in the Blank */}
                      {result.correctAnswerData.correctOptions && (
                        <p>- {result.correctAnswerData.correctOptions.map(opt => opt.optionText).join(' / ')}</p>
                      )}
                      {result.correctAnswerData.correctAnswers && (
                        <p>- {result.correctAnswerData.correctAnswers.join(' HOẶC ')}</p>
                      )}
                      {result.correctAnswerData.rubric && (
                        <p className="text-xs text-purple-700 mt-2">Rubric: {result.correctAnswerData.rubric}</p>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  {result.explanation && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="font-semibold">Explanation:</p>
                      <p>{result.explanation}</p>
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
