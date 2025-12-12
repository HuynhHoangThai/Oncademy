import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/students/Loading';
import { Check, X } from 'lucide-react';

const GradeQuiz = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [grades, setGrades] = useState({});
  const [feedback, setFeedback] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttemptData();
    // eslint-disable-next-line
  }, []);

  const fetchAttemptData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/quiz/attempt/${attemptId}/grade`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setAttempt(data.attempt);
        setQuiz(data.quiz);

        // Initialize grades and feedback from existing data
        const initialGrades = {};
        const initialFeedback = {};
        data.attempt.answers.forEach((answer, index) => {
          if (answer.isCorrect === null) {
            initialGrades[index] = answer.pointsEarned || 0;
            initialFeedback[index] = answer.feedback || '';
          }
        });
        setGrades(initialGrades);
        setFeedback(initialFeedback);
      } else {
        toast.error(data.message || 'Failed to load attempt');
        navigate(-1);
      }
    } catch (error) {
      console.error('Fetch attempt error:', error);
      toast.error('Failed to load attempt data');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (index, value) => {
    const numValue = parseFloat(value) || 0;
    const question = quiz.questions.find(q => q.questionId === attempt.answers[index].questionId);
    const maxPoints = question?.points || 0;

    if (numValue < 0 || numValue > maxPoints) {
      toast.error(`Points must be between 0 and ${maxPoints}`);
      return;
    }

    setGrades(prev => ({
      ...prev,
      [index]: numValue
    }));
  };

  const handleFeedbackChange = (index, value) => {
    setFeedback(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const handleSaveGrades = async () => {
    try {
      setSaving(true);
      const token = await getToken();

      // Prepare grading data
      const gradingData = attempt.answers.map((answer, index) => {
        if (answer.isCorrect === null) {
          // Essay question - need manual grading
          return {
            questionId: answer.questionId,
            pointsEarned: grades[index] || 0,
            feedback: feedback[index] || ''
          };
        }
        return null;
      }).filter(Boolean);

      const { data } = await axios.patch(
        `${backendUrl}/api/quiz/attempt/${attemptId}/grade`,
        { grades: gradingData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Grades saved successfully!');
        navigate(-1);
      } else {
        toast.error(data.message || 'Failed to save grades');
      }
    } catch (error) {
      console.error('Save grades error:', error);
      toast.error('Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True/False',
      'essay': 'Essay',
      'fill-blank': 'Fill in the Blank'
    };
    return labels[type] || type;
  };

  if (loading) return <Loading />;
  if (!attempt || !quiz) return null;

  const isPending = attempt.status === 'pending';
  const totalPoints = attempt.scoring?.totalPoints || 0;
  const currentPoints = attempt.scoring?.pointsEarned || 0;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Submissions
          </button>
          <h1 className="text-3xl font-bold text-blue-700">Grade Quiz Attempt</h1>
          <p className="text-gray-600 mt-1">{quiz.quizTitle}</p>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Student</p>
              <p className="font-semibold text-gray-800">{attempt.studentName || 'Unknown'}</p>
              <p className="text-xs text-gray-500">{attempt.studentEmail}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Attempt</p>
              <p className="font-semibold text-gray-800">#{attempt.attemptNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Submitted</p>
              <p className="font-semibold text-gray-800">
                {new Date(attempt.submittedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Score</p>
              <p className="font-semibold text-gray-800">
                {currentPoints} / {totalPoints} pts
              </p>
              {!isPending && (
                <p className="text-xs text-gray-500">
                  {attempt.scoring?.scorePercentage?.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-yellow-800">Pending Manual Grading</p>
                <p className="text-sm text-yellow-700">
                  This quiz contains essay questions that require your review and grading.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Questions Review */}
        <div className="space-y-4">
          {attempt.answers.map((answer, index) => {
            const question = quiz.questions.find(q => q.questionId === answer.questionId);
            if (!question) return null;

            const isEssay = answer.isCorrect === null;
            const isCorrect = answer.isCorrect === true;

            return (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${isEssay
                  ? 'border-yellow-200'
                  : isCorrect
                    ? 'border-green-200'
                    : 'border-red-200'
                  }`}
              >
                {/* Question Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800">Question {index + 1}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {getQuestionTypeLabel(question.questionType)}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {question.points} pts
                      </span>
                    </div>
                    <p className="text-gray-700">{question.questionText}</p>
                  </div>
                  <div className="ml-4">
                    {isEssay ? (
                      <span className="px-4 py-2 bg-yellow-100 text-yellow-700 font-semibold rounded-lg">
                        Needs Grading
                      </span>
                    ) : isCorrect ? (
                      <span className="px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-lg">
                        <Check className="inline-block mr-1" size={16} /> Correct
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg">
                        <X className="inline-block mr-1" size={16} /> Incorrect
                      </span>
                    )}
                  </div>
                </div>

                {/* Student Answer */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Student's Answer:</p>
                  <div className="bg-white rounded p-3 border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{answer.answer || 'No answer provided'}</p>
                  </div>
                </div>

                {/* Correct Answer (for auto-graded questions) */}
                {!isEssay && question.correctAnswers && (
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-green-700 mb-2">Correct Answer:</p>
                    <p className="text-green-800">{question.correctAnswers.join(', ')}</p>
                  </div>
                )}

                {/* Explanation */}
                {question.explanation && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-700 mb-2">Explanation:</p>
                    <p className="text-blue-800">{question.explanation}</p>
                  </div>
                )}

                {/* Rubric (for essay questions) */}
                {isEssay && question.rubric && (
                  <div className="bg-purple-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-purple-700 mb-2">Grading Rubric:</p>
                    <p className="text-purple-800 whitespace-pre-wrap">{question.rubric}</p>
                  </div>
                )}

                {/* Manual Grading Section (for essay questions) */}
                {isEssay && (
                  <div className="border-t-2 border-yellow-200 pt-4 mt-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Grade This Answer</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Points Earned (Max: {question.points})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={question.points}
                          step="0.5"
                          value={grades[index] || 0}
                          onChange={(e) => handleGradeChange(index, e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Grade
                        </label>
                        <div className="flex items-center h-10">
                          <span className="text-2xl font-bold text-blue-700">
                            {((grades[index] || 0) / question.points * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback for Student
                      </label>
                      <textarea
                        value={feedback[index] || ''}
                        onChange={(e) => handleFeedbackChange(index, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="Provide feedback to help the student improve..."
                      />
                    </div>
                  </div>
                )}

                {/* Auto-graded Score Display */}
                {!isEssay && (
                  <div className="border-t-2 border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Points Earned:</span>
                      <span className={`text-xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {answer.pointsEarned} / {question.points}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        {isPending && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGrades}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                'Save Grades'
              )}
            </button>
          </div>
        )}

        {/* Already Graded Message */}
        {!isPending && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-green-800">This quiz has been graded</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeQuiz;
