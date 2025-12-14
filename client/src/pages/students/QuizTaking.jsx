import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/students/Loading';
import { Clock } from 'lucide-react';

const QuizTaking = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const fetchQuiz = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/quiz/${quizId}/take`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.maxAttemptsReached) {
        setQuiz({ ...data.quiz, previousAttempts: data.previousAttempts });
      } else if (data.success) {
        setQuiz({ ...data.quiz, previousAttempts: data.previousAttempts });
        setTimeRemaining(data.quiz.duration * 60); // Convert to seconds
        // Initialize answers object
        const initialAnswers = {};
        data.quiz.questions.forEach((q, index) => {
          initialAnswers[index] = q.questionType === 'multiple-choice' ? null : '';
        });
        setAnswers(initialAnswers);
      } else {
        toast.error(data.message || 'Failed to load quiz');
        navigate(-1);
      }
    } catch (error) {
      console.error('Fetch quiz error:', error);
      toast.error('Failed to load quiz');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [quizId, getToken, backendUrl, navigate]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // Timer countdown
  useEffect(() => {
    if (!quizStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line
  }, [quizStarted, timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Check if all questions answered
    const unanswered = Object.values(answers).filter(a => a === null || a === '').length;
    if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();

      // Transform answers to match backend format
      const formattedAnswers = quiz.questions.map((q, index) => ({
        questionId: q.questionId,
        answer: answers[index]
      }));

      const { data } = await axios.post(
        `${backendUrl}/api/quiz/${quizId}/submit`,
        { answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Quiz submitted successfully!');
        navigate(`/quiz/${quizId}/result/${data.attemptId}`);
      } else {
        toast.error(data.message || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Submit quiz error:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  if (loading) return <Loading />;
  if (!quiz) return null;

  if (!quizStarted && quiz) {
    const isMaxAttempts = quiz.maxAttemptsReached;
    const attemptsUsed = quiz.previousAttempts || 0;

    if (isMaxAttempts) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 text-center">
            <svg className="mx-auto h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-3xl font-bold text-red-700 mb-2">Limit Reached!</h1>
            <p className="text-gray-600 mb-6">
              You have reached the maximum allowed attempts ({quiz.maxAttempts}) for this quiz.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-700 mb-2">{quiz.quizTitle}</h1>
            <p className="text-gray-600">{quiz.quizDescription}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-gray-600 text-sm mb-1">Questions</p>
              <p className="text-2xl font-bold text-blue-700">{quiz.questions.length}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-gray-600 text-sm mb-1">Duration</p>
              <p className="text-2xl font-bold text-purple-700">{quiz.duration} min</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-gray-600 text-sm mb-1">Passing Score</p>
              <p className="text-2xl font-bold text-green-700">{quiz.passingScore}%</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-gray-600 text-sm mb-1">Total Points</p>
              <p className="text-2xl font-bold text-orange-700">{quiz.totalPoints}</p>
            </div>
            <div className={`rounded-lg p-4 text-center ${quiz.maxAttempts > 0 && (quiz.maxAttempts - attemptsUsed) <= 0
                ? 'bg-red-50'
                : quiz.maxAttempts > 0 && (quiz.maxAttempts - attemptsUsed) === 1
                  ? 'bg-yellow-50'
                  : 'bg-orange-50'
              }`}>
              <p className="text-gray-600 text-sm mb-1">Attempts Left</p>
              <p className={`text-2xl font-bold ${quiz.maxAttempts > 0 && (quiz.maxAttempts - attemptsUsed) <= 0
                  ? 'text-red-700'
                  : quiz.maxAttempts > 0 && (quiz.maxAttempts - attemptsUsed) === 1
                    ? 'text-yellow-700'
                    : 'text-orange-700'
                }`}>
                {quiz.maxAttempts === 0
                  ? 'Unlimited'
                  : `${quiz.maxAttempts - attemptsUsed} / ${quiz.maxAttempts}`
                }
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2"> Instructions:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Answer all questions before submitting</li>
              <li>• Timer will start when you begin the quiz</li>
              <li>• Quiz auto-submits when time runs out</li>
              <li>• You cannot pause or restart once started</li>
            </ul>
          </div>

          {/* Warning when no attempts remaining */}
          {quiz.maxAttempts > 0 && (quiz.maxAttempts - attemptsUsed) <= 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-red-800">No Attempts Remaining</span>
              </div>
              <p className="text-sm text-red-700 mt-2">
                You have used all {quiz.maxAttempts} allowed attempts for this quiz. You cannot retake this quiz.
              </p>
            </div>
          )}

          <button
            onClick={startQuiz}
            disabled={quiz.maxAttempts > 0 && (quiz.maxAttempts - attemptsUsed) <= 0}
            className={`w-full py-4 font-bold text-lg rounded-lg transition-colors shadow-lg ${quiz.maxAttempts > 0 && (quiz.maxAttempts - attemptsUsed) <= 0
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            {quiz.maxAttempts > 0 && (quiz.maxAttempts - attemptsUsed) <= 0
              ? 'No Attempts Remaining'
              : 'Start Quiz'}
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header with timer */}
      <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{quiz.quizTitle}</h1>
            <p className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
              <Clock className="inline-block mr-1" size={20} /> {formatTime(timeRemaining)}
            </div>
            <p className="text-xs text-gray-500">Time Remaining</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-2">
          <div
            className="bg-blue-600 h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Question {currentQuestion + 1}
            </h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {currentQ.points} {currentQ.points === 1 ? 'point' : 'points'}
            </span>
          </div>

          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{currentQ.questionText}</p>

          {/* Multiple Choice */}
          {currentQ.questionType === 'multiple-choice' && (
            <div className="space-y-3">
              {currentQ.options.map((option, optIndex) => (
                <label
                  key={optIndex}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${answers[currentQuestion] === option.optionId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={option.optionId}
                    checked={answers[currentQuestion] === option.optionId}
                    onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <span className="flex-1 text-gray-800">{option.optionText}</span>
                </label>
              ))}
            </div>
          )}

          {/* True/False */}
          {currentQ.questionType === 'true-false' && (
            <div className="space-y-3">
              {currentQ.options.map((option, optIndex) => (
                <label
                  key={optIndex}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${answers[currentQuestion] === option.optionId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={option.optionId}
                    checked={answers[currentQuestion] === option.optionId}
                    onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="flex-1 text-gray-800 font-medium">{option.optionText}</span>
                </label>
              ))}
            </div>
          )}

          {/* Essay */}
          {currentQ.questionType === 'essay' && (
            <div>
              <textarea
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="8"
                placeholder="Type your answer here..."
                maxLength={currentQ.maxWords * 6} // Approx 6 chars per word
              />
              <p className="text-sm text-gray-500 mt-2">
                Maximum {currentQ.maxWords} words
              </p>
            </div>
          )}

          {/* Fill in the Blank */}
          {currentQ.questionType === 'fill-blank' && (
            <div>
              <input
                type="text"
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your answer..."
              />
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${index === currentQuestion
                  ? 'bg-blue-600 text-white'
                  : answers[index] !== null && answers[index] !== ''
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 shadow-lg"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTaking;
