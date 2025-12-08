import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/students/Loading';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TextField } from '@mui/material';
import dayjs from 'dayjs';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const QuizBuilder = () => {
  const { courseId, quizId } = useParams(); // Add quizId for edit mode
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [deadline, setDeadline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedLecture, setSelectedLecture] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [quizData, setQuizData] = useState({
    quizTitle: '',
    quizDescription: '',
    quizType: 'quiz',
    duration: 30,
    passingScore: 70,
    maxAttempts: 3,
    shuffleQuestions: false,
    shuffleOptions: false,
    showCorrectAnswers: true,
    questions: []
  });

  useEffect(() => {
    if (quizId) {
      setIsEditMode(true);
      fetchQuizData();
    } else {
      fetchCourse();
    }
    // eslint-disable-next-line
  }, [quizId]);

  const fetchCourse = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setCourse(data.courseData);
      } else {
        toast.error(data.message || 'Course not found');
        navigate('/educator/quizzes');
      }
    } catch (error) {
      console.error('Fetch course error:', error);
      toast.error(error.response?.data?.message || 'Failed to load course');
      navigate('/educator/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizData = async () => {
    try {
      const token = await getToken();
      
      // Fetch quiz data
      const { data: quizResponse } = await axios.get(`${backendUrl}/api/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (quizResponse.success) {
        const quiz = quizResponse.quiz;
        
        // Fetch course data
        const { data: courseResponse } = await axios.get(`${backendUrl}/api/course/${quiz.courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (courseResponse.success) {
          setCourse(courseResponse.courseData);
        }

        // Transform questions to match form structure
        const transformedQuestions = quiz.questions.map((q, index) => {
          const baseQuestion = {
            id: Date.now() + index,
            questionText: q.questionText,
            questionType: q.questionType,
            points: q.points,
            explanation: q.explanation || '',
            caseSensitive: q.caseSensitive || false,
            maxWords: q.maxWords || 500,
            rubric: q.rubric || ''
          };

          // Handle multiple-choice
          if (q.questionType === 'multiple-choice') {
            // Ensure options are array of strings before mapping
            let optionsArr = Array.isArray(q.options)
              ? q.options.map(opt => typeof opt === 'string' ? opt : (opt.optionText || ''))
              : [];
            baseQuestion.options = optionsArr;
            const correctIndex = (q.options || []).findIndex(opt => opt.isCorrect);
            baseQuestion.correctAnswer = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : '';
          }
          // Handle true-false
          else if (q.questionType === 'true-false') {
            baseQuestion.options = [];
            if (typeof q.correctAnswer === 'boolean') {
              baseQuestion.correctAnswer = q.correctAnswer ? 'true' : 'false';
            } else if (q.options && q.options.length > 0) {
              const correctOption = q.options.find(opt => opt.isCorrect);
              baseQuestion.correctAnswer = correctOption?.optionText?.toLowerCase() || 'true';
            } else {
              baseQuestion.correctAnswer = 'true';
            }
          }
          // Handle fill-blank
          else if (q.questionType === 'fill-blank') {
            baseQuestion.options = [];
            baseQuestion.correctAnswer = (q.correctAnswers && q.correctAnswers[0]) || '';
          }
          // Handle essay
          else if (q.questionType === 'essay') {
            baseQuestion.options = [];
            baseQuestion.correctAnswer = '';
          }
          // Default
          else {
            baseQuestion.options = [];
            baseQuestion.correctAnswer = '';
          }

          return baseQuestion;
        });

        setDeadline(quiz.deadline ? dayjs(quiz.deadline) : null);

        setQuizData({
          quizTitle: quiz.quizTitle,
          quizDescription: quiz.quizDescription,
          quizType: quiz.quizType,
          duration: quiz.duration,
          passingScore: quiz.passingScore,
          maxAttempts: quiz.attemptsAllowed,
          shuffleQuestions: quiz.shuffleQuestions,
          shuffleOptions: quiz.shuffleOptions,
          showCorrectAnswers: quiz.showCorrectAnswers,
          questions: transformedQuestions
        });

        setSelectedChapter(quiz.chapterId || '');
        setSelectedLecture(quiz.lectureId || '');
      } else {
        toast.error(quizResponse.message || 'Quiz not found');
        navigate('/educator/quizzes');
      }
    } catch (error) {
      console.error('Fetch quiz error:', error);
      toast.error(error.response?.data?.message || 'Failed to load quiz');
      navigate('/educator/quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuizData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      questionText: '',
      questionType: type,
      points: 1,
      options: type === 'multiple-choice' ? ['', '', '', ''] : [],
      correctAnswer: type === 'true-false' ? 'true' : '',
      explanation: '',
      caseSensitive: false,
      maxWords: type === 'essay' ? 500 : undefined,
      rubric: type === 'essay' ? '' : undefined
    };
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    
    // Scroll to the new question after a short delay
    setTimeout(() => {
      const questionElements = document.querySelectorAll('[data-question-card]');
      const lastQuestion = questionElements[questionElements.length - 1];
      if (lastQuestion) {
        lastQuestion.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const removeQuestion = (questionId) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const updateQuestion = (questionId, field, value) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, options: q.options.map((opt, i) => i === optionIndex ? value : opt) }
          : q
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!quizData.quizTitle.trim()) {
      toast.error('Please enter quiz title');
      return;
    }

    if (deadline && deadline.isBefore(dayjs())) {
      toast.error("Deadline must be set in the future.");
      return;
    }

    if (quizData.questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    // Validate each question
    for (const q of quizData.questions) {
      if (!q.questionText.trim()) {
        toast.error('All questions must have text');
        return;
      }
      if (q.questionType === 'multiple-choice') {
        if (q.options.some(opt => !opt.trim())) {
          toast.error('All options must be filled');
          return;
        }
        if (!q.correctAnswer) {
          toast.error('All multiple-choice questions must have a correct answer');
          return;
        }
      }
      if (q.questionType === 'true-false' && !q.correctAnswer) {
        toast.error('All true/false questions must have a correct answer');
        return;
      }
      if (q.questionType === 'fill-blank' && !q.correctAnswer?.trim()) {
        toast.error('All fill-in-the-blank questions must have a correct answer');
        return;
      }
      // Essay questions don't need correctAnswer validation
    }

    try {
      const token = await getToken();
      
      // Transform questions back to database format
      const transformedQuestions = quizData.questions.map((q, index) => {
        const baseQuestion = {
          questionId: `q_${Date.now()}_${index}`,
          questionType: q.questionType,
          questionText: q.questionText.trim(),
          points: q.points,
          explanation: q.explanation?.trim() || ''
        };

        if (q.questionType === 'multiple-choice') {
          // Transform options array of strings to array of objects
          baseQuestion.options = q.options.map((optText, optIndex) => ({
            optionId: String.fromCharCode(65 + optIndex), // A, B, C, D
            optionText: optText.trim(),
            isCorrect: String.fromCharCode(65 + optIndex) === q.correctAnswer
          }));
        } else if (q.questionType === 'true-false') {
          // Set correctAnswer as boolean
          baseQuestion.correctAnswer = q.correctAnswer === 'true';
          baseQuestion.options = [
            { optionId: 'true', optionText: 'True', isCorrect: baseQuestion.correctAnswer === true },
            { optionId: 'false', optionText: 'False', isCorrect: baseQuestion.correctAnswer === false }
          ];
        } else if (q.questionType === 'fill-blank') {
          // Set correctAnswers as array
          baseQuestion.correctAnswers = [q.correctAnswer.trim()];
          baseQuestion.caseSensitive = q.caseSensitive || false;
        } else if (q.questionType === 'essay') {
          // Set essay-specific fields
          baseQuestion.maxWords = q.maxWords || 500;
          baseQuestion.rubric = q.rubric?.trim() || '';
        }

        return baseQuestion;
      });

      const payload = {
        ...quizData,
        courseId: isEditMode ? course._id : courseId,
        chapterId: selectedChapter || undefined,
        lectureId: selectedLecture || undefined,
        attemptsAllowed: quizData.maxAttempts, 
        deadline: deadline ? deadline.toISOString() : null,
        totalPoints: transformedQuestions.reduce((sum, q) => sum + q.points, 0),
        questions: transformedQuestions
      };

      const url = isEditMode 
        ? `${backendUrl}/api/quiz/${quizId}`
        : `${backendUrl}/api/quiz/create`;
      
      const method = isEditMode ? 'put' : 'post';

      const { data } = await axios[method](
        url,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (data.success) {
        toast.success(isEditMode ? 'Quiz updated successfully!' : 'Quiz created successfully!');
        navigate('/educator/quizzes');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(isEditMode ? 'Update quiz error:' : 'Create quiz error:', error);
      toast.error(error?.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} quiz`);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-3xl font-bold text-blue-700">
            {isEditMode ? 'Edit Quiz' : 'Create New Quiz'}
          </h1>
          <p className="text-gray-600 mt-1">Course: {course?.courseTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chapter & Lecture Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quiz Location (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select a specific chapter or lecture for this quiz, or leave empty for course-level quiz
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chapter</label>
                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    setSelectedChapter(e.target.value);
                    setSelectedLecture(''); 
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Chapter (Optional) --</option>
                  {course?.courseContent?.map((chapter) => (
                    <option key={chapter.chapterId} value={chapter.chapterId}>
                      {chapter.chapterTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lecture</label>
                <select
                  value={selectedLecture}
                  onChange={(e) => setSelectedLecture(e.target.value)}
                  disabled={!selectedChapter}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- Select Lecture (Optional) --</option>
                  {selectedChapter && 
                    course?.courseContent
                      ?.find(ch => ch.chapterId === selectedChapter)
                      ?.chapterContent?.map((lecture) => (
                        <option key={lecture.lectureId} value={lecture.lectureId}>
                          {lecture.lectureTitle}
                        </option>
                      ))
                  }
                </select>
              </div>
            </div>
          </div>

          {/* Quiz Settings Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quiz Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="quizTitle"
                  value={quizData.quizTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="quizDescription"
                  value={quizData.quizDescription}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter quiz description"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quiz Type</label>
                <select
                  name="quizType"
                  value={quizData.quizType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="final-exam">Final Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={quizData.duration}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Passing Score (%)</label>
                <input
                  type="number"
                  name="passingScore"
                  value={quizData.passingScore}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Attempts</label>
                <input
                  type="number"
                  name="maxAttempts"
                  value={quizData.maxAttempts}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-1" style={{ zIndex: 10 }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline (Optional)</label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateTimePicker
                    label="Select Due Date & Time"
                    value={deadline}
                    onChange={(newValue) => setDeadline(newValue)}

                    minDateTime={dayjs()}

                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        inputProps: { 'aria-label': 'Deadline picker' },

                        sx: {
                          '& .MuiInputBase-root': {
                            borderRadius: '0.5rem', 
                            padding: '0',
                            height: 'auto',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#d1d5db !important',
                          },
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#121314ff !important',
                            borderWidth: '2px !important',
                          },
                          '& .MuiInputBase-input': {
                            padding: '8px 16px !important', 
                            height: 'auto',
                          },
                          '& .MuiInputLabel-root': {
                            color: '#4b5563', 
                          }
                        }
                      },
                    }}
                  />
                </LocalizationProvider>
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="shuffleQuestions"
                    checked={quizData.shuffleQuestions}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Shuffle Questions</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="shuffleOptions"
                    checked={quizData.shuffleOptions}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Shuffle Options</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="showCorrectAnswers"
                    checked={quizData.showCorrectAnswers}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Show Correct Answers After Submission</span>
                </label>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Questions ({quizData.questions.length})</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion('multiple-choice')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                >
                  + Multiple Choice
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('true-false')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
                >
                  + True/False
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('essay')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
                >
                  + Essay
                </button>
              </div>
            </div>

            {quizData.questions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No questions added yet. Click the buttons above to add questions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quizData.questions.map((question, index) => (
                  <div key={question.id} data-question-card className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-800">Question {index + 1} ({question.questionType})</h3>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                        <textarea
                          value={question.questionText}
                          onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows="2"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>

                      {question.questionType === 'multiple-choice' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Options *</label>
                          {question.options.map((option, optIndex) => (
                            <input
                              key={optIndex}
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              required
                            />
                          ))}
                          <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">Correct Answer *</label>
                          <select
                            value={question.correctAnswer}
                            onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            required
                          >
                            <option value="">-- Select correct option --</option>
                            {question.options.map((_, optIndex) => (
                              <option key={optIndex} value={String.fromCharCode(65 + optIndex)}>
                                Option {String.fromCharCode(65 + optIndex)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {question.questionType === 'true-false' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
                          <select
                            value={question.correctAnswer}
                            onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            required
                          >
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        </div>
                      )}

                      {question.questionType === 'essay' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Max Words</label>
                          <input
                            type="number"
                            value={question.maxWords}
                            onChange={(e) => updateQuestion(question.id, 'maxWords', parseInt(e.target.value) || 500)}
                            min="10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Rubric/Grading Criteria</label>
                          <textarea
                            value={question.rubric}
                            onChange={(e) => updateQuestion(question.id, 'rubric', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows="2"
                            placeholder="Enter grading criteria for manual grading"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
                        <textarea
                          value={question.explanation}
                          onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows="2"
                          placeholder="Explain the correct answer"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/educator/quizzes')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition"
            >
              {isEditMode ? 'Update Quiz' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizBuilder;
