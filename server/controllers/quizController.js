import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Course from '../models/Course.js';
import * as XLSX from 'xlsx';

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Create quiz manually
const createQuiz = async (req, res) => {
  try {
    console.log('📝 createQuiz - req.body:', req.body);
    console.log('📝 createQuiz - req.userId:', req.userId);

    const { courseId, chapterId, lectureId, questions, ...quizSettings } = req.body;
    const educatorId = req.userId;

    if (!educatorId) {
      return res.json({ success: false, message: 'User ID not found' });
    }

    if (!courseId) {
      return res.json({ success: false, message: 'Course ID is required' });
    }

    // Verify course ownership
    const course = await Course.findById(courseId);
    if (!course) {
      return res.json({ success: false, message: 'Course not found' });
    }
    
    if (course.educator.toString() !== educatorId) {
      return res.json({ success: false, message: 'Unauthorized - not your course' });
    }

    // Transform questions to match schema
    const transformedQuestions = (questions || []).map((q, index) => {
      const baseQuestion = {
        questionId: q.questionId || generateId(),
        questionType: q.questionType,
        questionText: q.questionText,
        points: q.points || 1,
        explanation: q.explanation || ''
      };

      // Handle multiple-choice
      if (q.questionType === 'multiple-choice') {
        baseQuestion.options = (q.options || []).map((optionText, optIndex) => ({
          optionId: generateId(),
          optionText: optionText,
          isCorrect: q.correctAnswer === String.fromCharCode(65 + optIndex) // A=0, B=1, etc
        }));
      }

      // Handle true-false
      if (q.questionType === 'true-false') {
        baseQuestion.correctAnswer = q.correctAnswer === 'true' || q.correctAnswer === true;
        baseQuestion.options = [
          { optionId: generateId(), optionText: 'True', isCorrect: baseQuestion.correctAnswer === true },
          { optionId: generateId(), optionText: 'False', isCorrect: baseQuestion.correctAnswer === false }
        ];
      }

      // Handle essay
      if (q.questionType === 'essay') {
        baseQuestion.maxWords = q.maxWords || 500;
        baseQuestion.rubric = q.rubric || '';
      }

      // Handle fill-blank
      if (q.questionType === 'fill-blank') {
        baseQuestion.correctAnswers = Array.isArray(q.correctAnswer) 
          ? q.correctAnswer 
          : [q.correctAnswer];
        baseQuestion.caseSensitive = q.caseSensitive || false;
      }

      return baseQuestion;
    });

    // Create quiz with all data from request body
    const quiz = new Quiz({
      quizTitle: quizSettings.quizTitle,
      quizDescription: quizSettings.quizDescription,
      quizType: quizSettings.quizType || 'quiz',
      duration: quizSettings.duration || 30,
      passingScore: quizSettings.passingScore || 70,
      attemptsAllowed: quizSettings.maxAttempts || quizSettings.attemptsAllowed || 0,
      shuffleQuestions: quizSettings.shuffleQuestions || false,
      shuffleOptions: quizSettings.shuffleOptions || false,
      showCorrectAnswers: quizSettings.showCorrectAnswers !== false,
      showScoreImmediately: quizSettings.showScoreImmediately !== false,
      courseId,
      chapterId: chapterId || null,
      lectureId: lectureId || null,
      questions: transformedQuestions,
      createdBy: educatorId,
      isPublished: false
    });

    await quiz.save();

    console.log('✅ Quiz saved:', quiz._id);

    res.json({
      success: true,
      message: 'Quiz created successfully',
      quiz
    });
  } catch (error) {
    console.error('❌ Create quiz error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Upload quiz from Excel
const uploadQuizFromExcel = async (req, res) => {
  try {
    const { courseId, chapterId, lectureId } = req.body;
    const educatorId = req.userId;

    if (!req.file) {
      return res.json({ success: false, message: 'No file uploaded' });
    }

    // Verify course ownership
    const course = await Course.findById(courseId);
    if (!course || course.educator !== educatorId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.json({ success: false, message: 'Excel file is empty' });
    }

    // Parse Excel data to quiz format
    const quizTitle = data[0].QuizTitle || 'Imported Quiz';
    const quizDescription = data[0].QuizDescription || '';
    const duration = parseInt(data[0].Duration) || 30;
    const passingScore = parseInt(data[0].PassingScore) || 70;

    const questions = [];
    let currentQuestionId = null;
    let currentQuestion = null;

    data.forEach((row, index) => {
      // Skip header info rows
      if (index === 0) return;

      const questionType = row.QuestionType?.toLowerCase();
      const questionText = row.Question;
      const points = parseInt(row.Points) || 1;

      if (questionText && questionType) {
        // Save previous question if exists
        if (currentQuestion) {
          questions.push(currentQuestion);
        }

        // Create new question
        currentQuestionId = generateId();
        currentQuestion = {
          questionId: currentQuestionId,
          questionType,
          questionText,
          points,
          options: [],
          correctAnswers: [],
          explanation: row.Explanation || ''
        };

        // Handle different question types
        if (questionType === 'multiple-choice') {
          const optionA = row.OptionA;
          const optionB = row.OptionB;
          const optionC = row.OptionC;
          const optionD = row.OptionD;
          const correctOption = row.CorrectAnswer?.toUpperCase();

          if (optionA) currentQuestion.options.push({
            optionId: 'A',
            optionText: optionA,
            isCorrect: correctOption === 'A'
          });
          if (optionB) currentQuestion.options.push({
            optionId: 'B',
            optionText: optionB,
            isCorrect: correctOption === 'B'
          });
          if (optionC) currentQuestion.options.push({
            optionId: 'C',
            optionText: optionC,
            isCorrect: correctOption === 'C'
          });
          if (optionD) currentQuestion.options.push({
            optionId: 'D',
            optionText: optionD,
            isCorrect: correctOption === 'D'
          });
        } else if (questionType === 'true-false') {
          currentQuestion.correctAnswer = row.CorrectAnswer?.toLowerCase() === 'true';
          currentQuestion.options = [
            { optionId: 'true', optionText: 'True', isCorrect: currentQuestion.correctAnswer },
            { optionId: 'false', optionText: 'False', isCorrect: !currentQuestion.correctAnswer }
          ];
        } else if (questionType === 'fill-blank') {
          const answers = row.CorrectAnswer?.split('|') || [];
          currentQuestion.correctAnswers = answers.map(a => a.trim());
          currentQuestion.caseSensitive = row.CaseSensitive?.toLowerCase() === 'yes';
        } else if (questionType === 'essay') {
          currentQuestion.maxWords = parseInt(row.MaxWords) || 500;
          currentQuestion.rubric = row.Rubric || '';
        }
      }
    });

    // Push last question
    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    // Create quiz
    const quiz = new Quiz({
      courseId,
      chapterId,
      lectureId,
      quizTitle,
      quizDescription,
      duration,
      passingScore,
      questions,
      createdBy: educatorId,
      isPublished: false // Save as draft
    });

    await quiz.save();

    res.json({
      success: true,
      message: `Quiz created with ${questions.length} questions`,
      quiz
    });
  } catch (error) {
    console.error('Upload quiz error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get all quizzes for a course
const getCourseQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const educatorId = req.userId;

    // Verify course ownership
    const course = await Course.findById(courseId);
    if (!course || course.educator !== educatorId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    const quizzes = await Quiz.find({ courseId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      quizzes
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get published quizzes for students
const getPublishedQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;

    const quizzes = await Quiz.find({ 
      courseId, 
      isPublished: true 
    })
    .select('-questions.correctAnswer -questions.correctAnswers -questions.options.isCorrect') // Hide answers
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      quizzes
    });
  } catch (error) {
    console.error('Get published quizzes error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get quiz for taking (students)
const getQuizForTaking = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId;

    const quiz = await Quiz.findById(quizId)
      .select('-questions.correctAnswer -questions.correctAnswers -questions.options.isCorrect');

    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found' });
    }

    if (!quiz.isPublished) {
      return res.json({ success: false, message: 'Quiz is not available' });
    }

    // Check previous attempts
    const attempts = await QuizAttempt.find({
      quizId,
      studentId: userId
    }).sort({ attemptNumber: -1 });

    const attemptNumber = attempts.length + 1;

    // Check if max attempts reached
    if (quiz.attemptsAllowed > 0 && attempts.length >= quiz.attemptsAllowed) {
      return res.json({
        success: false,
        message: `Maximum attempts (${quiz.attemptsAllowed}) reached`
      });
    }

    res.json({
      success: true,
      quiz,
      attemptNumber,
      previousAttempts: attempts.length
    });
  } catch (error) {
    console.error('Get quiz for taking error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Submit quiz attempt
const submitQuizAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    const userId = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz || !quiz.isPublished) {
      return res.json({ success: false, message: 'Quiz not available' });
    }

    // Check previous attempts
    const attempts = await QuizAttempt.find({
      quizId,
      studentId: userId
    });

    if (quiz.attemptsAllowed > 0 && attempts.length >= quiz.attemptsAllowed) {
      return res.json({ success: false, message: 'Maximum attempts reached' });
    }

    // Grade the quiz
    let pointsEarned = 0;
    const gradedAnswers = answers.map(({ questionId, answer }) => {
      const question = quiz.questions.find(q => q.questionId === questionId);
      if (!question) return { questionId, answer, isCorrect: false, pointsEarned: 0 };

      let isCorrect = false;
      let pointsForQuestion = 0;

      // Auto-grade multiple choice and true/false
      if (question.questionType === 'multiple-choice' || question.questionType === 'true-false') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = correctOption && answer === correctOption.optionId;
        if (isCorrect) {
          pointsForQuestion = question.points;
          pointsEarned += question.points;
        }
      }

      // Fill in the blank
      if (question.questionType === 'fill-blank') {
        const normalizedAnswer = question.caseSensitive 
          ? answer.trim() 
          : answer.trim().toLowerCase();
        
        isCorrect = question.correctAnswers.some(correctAns => {
          const normalizedCorrect = question.caseSensitive 
            ? correctAns.trim() 
            : correctAns.trim().toLowerCase();
          return normalizedAnswer === normalizedCorrect;
        });

        if (isCorrect) {
          pointsForQuestion = question.points;
          pointsEarned += question.points;
        }
      }

      // Essay - needs manual grading
      if (question.questionType === 'essay') {
        isCorrect = null; // To be graded manually
        pointsForQuestion = null;
      }

      return {
        questionId,
        answer,
        isCorrect,
        pointsEarned: pointsForQuestion
      };
    });

    const hasEssayQuestions = quiz.questions.some(q => q.questionType === 'essay');
    const scorePercentage = quiz.totalPoints > 0 
      ? (pointsEarned / quiz.totalPoints) * 100 
      : 0;
    
    const passed = hasEssayQuestions 
      ? null // Pending manual grading
      : scorePercentage >= quiz.passingScore;

    // Create attempt record
    const attempt = new QuizAttempt({
      quizId,
      studentId: userId,
      attemptNumber: attempts.length + 1,
      answers: gradedAnswers,
      scoring: {
        totalPoints: quiz.totalPoints,
        pointsEarned: hasEssayQuestions ? null : pointsEarned,
        scorePercentage: hasEssayQuestions ? null : scorePercentage,
        passed
      },
      status: hasEssayQuestions ? 'pending' : 'completed',
      submittedAt: new Date()
    });

    await attempt.save();

    res.json({
      success: true,
      message: hasEssayQuestions 
        ? 'Quiz submitted. Awaiting manual grading for essay questions.' 
        : 'Quiz submitted successfully!',
      attemptId: attempt._id,
      scoring: attempt.scoring,
      needsGrading: hasEssayQuestions
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get quiz details
const getQuizDetails = async (req, res) => {
  try {
    const { quizId } = req.params;
    const educatorId = req.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found' });
    }

    // Verify ownership
    if (quiz.createdBy !== educatorId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Get quiz details error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Update quiz
const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const educatorId = req.userId;
    const updates = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found' });
    }

    if (quiz.createdBy !== educatorId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    Object.assign(quiz, updates);
    await quiz.save();

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      quiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Delete quiz
const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const educatorId = req.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found' });
    }

    if (quiz.createdBy !== educatorId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    await Quiz.findByIdAndDelete(quizId);
    await QuizAttempt.deleteMany({ quizId });

    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Publish/unpublish quiz
const toggleQuizPublish = async (req, res) => {
  try {
    const { quizId } = req.params;
    const educatorId = req.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.json({ success: false, message: 'Quiz not found' });
    }

    if (quiz.createdBy !== educatorId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    quiz.isPublished = !quiz.isPublished;
    await quiz.save();

    res.json({
      success: true,
      message: `Quiz ${quiz.isPublished ? 'published' : 'unpublished'} successfully`,
      quiz
    });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get quiz submissions
const getQuizSubmissions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const educatorId = req.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.createdBy !== educatorId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    const submissions = await QuizAttempt.find({ quizId })
      .sort({ submittedAt: -1 });

    // Fetch student info from Clerk
    const { clerkClient } = await import('@clerk/express');
    const submissionsWithStudentInfo = await Promise.all(
      submissions.map(async (submission) => {
        try {
          const user = await clerkClient.users.getUser(submission.studentId);
          return {
            ...submission.toObject(),
            studentName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
            studentEmail: user.emailAddresses?.[0]?.emailAddress || 'No email'
          };
        } catch (error) {
          console.error(`Error fetching user ${submission.studentId}:`, error);
          return {
            ...submission.toObject(),
            studentName: 'Unknown',
            studentEmail: 'No email'
          };
        }
      })
    );

    res.json({
      success: true,
      quiz,
      submissions: submissionsWithStudentInfo
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Download Excel template
const downloadExcelTemplate = async (req, res) => {
  try {
    // Create template data
    const templateData = [
      {
        QuizTitle: 'Sample Quiz',
        QuizDescription: 'Quiz description here',
        Duration: '30',
        PassingScore: '70',
        Question: '',
        QuestionType: '',
        Points: '',
        OptionA: '',
        OptionB: '',
        OptionC: '',
        OptionD: '',
        CorrectAnswer: '',
        Explanation: '',
        MaxWords: '',
        Rubric: '',
        CaseSensitive: ''
      },
      {
        QuizTitle: '',
        QuizDescription: '',
        Duration: '',
        PassingScore: '',
        Question: 'What is React?',
        QuestionType: 'multiple-choice',
        Points: '5',
        OptionA: 'A JavaScript library',
        OptionB: 'A programming language',
        OptionC: 'A database',
        OptionD: 'An operating system',
        CorrectAnswer: 'A',
        Explanation: 'React is a JavaScript library for building user interfaces',
        MaxWords: '',
        Rubric: '',
        CaseSensitive: ''
      },
      {
        QuizTitle: '',
        QuizDescription: '',
        Duration: '',
        PassingScore: '',
        Question: 'React uses Virtual DOM',
        QuestionType: 'true-false',
        Points: '2',
        OptionA: '',
        OptionB: '',
        OptionC: '',
        OptionD: '',
        CorrectAnswer: 'true',
        Explanation: 'React uses Virtual DOM for efficient rendering',
        MaxWords: '',
        Rubric: '',
        CaseSensitive: ''
      },
      {
        QuizTitle: '',
        QuizDescription: '',
        Duration: '',
        PassingScore: '',
        Question: 'Explain the concept of hooks in React',
        QuestionType: 'essay',
        Points: '10',
        OptionA: '',
        OptionB: '',
        OptionC: '',
        OptionD: '',
        CorrectAnswer: '',
        Explanation: '',
        MaxWords: '200',
        Rubric: 'Must mention useState and useEffect',
        CaseSensitive: ''
      },
      {
        QuizTitle: '',
        QuizDescription: '',
        Duration: '',
        PassingScore: '',
        Question: 'The ____ hook is used for state management',
        QuestionType: 'fill-blank',
        Points: '3',
        OptionA: '',
        OptionB: '',
        OptionC: '',
        OptionD: '',
        CorrectAnswer: 'useState|usestate',
        Explanation: 'useState is the hook for managing state',
        MaxWords: '',
        Rubric: '',
        CaseSensitive: 'no'
      }
    ];

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quiz Template');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=quiz-template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get quiz attempt result
const getQuizAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.auth?.userId;

    if (!studentId) {
      return res.json({ success: false, message: 'User not authenticated' });
    }

    const attempt = await QuizAttempt.findById(attemptId)
      .populate('quizId', 'quizTitle quizDescription')
      .lean();

    if (!attempt) {
      return res.json({ success: false, message: 'Quiz attempt not found' });
    }

    // Verify student owns this attempt
    if (attempt.studentId !== studentId) {
      return res.json({ success: false, message: 'Unauthorized access' });
    }

    res.json({ success: true, attempt });
  } catch (error) {
    console.error('Get quiz attempt error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get quiz attempt for grading (Educator)
const getAttemptForGrading = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const educatorId = req.userId;

    const attempt = await QuizAttempt.findById(attemptId).lean();
    if (!attempt) {
      return res.json({ success: false, message: 'Attempt not found' });
    }

    // Get quiz and verify educator owns it
    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz || quiz.createdBy !== educatorId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    // Fetch student info from Clerk
    const { clerkClient } = await import('@clerk/express');
    try {
      const user = await clerkClient.users.getUser(attempt.studentId);
      attempt.studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
      attempt.studentEmail = user.emailAddresses?.[0]?.emailAddress || 'No email';
    } catch (error) {
      console.error('Error fetching student info:', error);
      attempt.studentName = 'Unknown';
      attempt.studentEmail = 'No email';
    }

    res.json({
      success: true,
      attempt,
      quiz
    });
  } catch (error) {
    console.error('Get attempt for grading error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Grade quiz attempt (Educator)
const gradeAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { grades } = req.body; // Array of { questionId, pointsEarned, feedback }
    const educatorId = req.userId;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.json({ success: false, message: 'Attempt not found' });
    }

    // Verify educator owns the quiz
    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz || quiz.createdBy !== educatorId) {
      return res.json({ success: false, message: 'Unauthorized' });
    }

    // Update grades for essay questions
    let totalPointsEarned = 0;
    attempt.answers = attempt.answers.map(answer => {
      const gradeInfo = grades.find(g => g.questionId === answer.questionId);
      
      if (gradeInfo) {
        // Manual grading for essay
        answer.pointsEarned = gradeInfo.pointsEarned;
        answer.feedback = gradeInfo.feedback || '';
        answer.isCorrect = gradeInfo.pointsEarned > 0;
      }
      
      totalPointsEarned += answer.pointsEarned || 0;
      return answer;
    });

    // Recalculate total score
    const totalPoints = attempt.scoring.totalPoints;
    const scorePercentage = (totalPointsEarned / totalPoints) * 100;
    const passed = scorePercentage >= quiz.passingScore;

    attempt.scoring = {
      totalPoints,
      pointsEarned: totalPointsEarned,
      scorePercentage,
      passed
    };

    attempt.status = 'graded';
    await attempt.save();

    res.json({
      success: true,
      message: 'Grades saved successfully',
      attempt
    });
  } catch (error) {
    console.error('Grade attempt error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get educator's quiz statistics
const getEducatorQuizStats = async (req, res) => {
  try {
    const educatorId = req.userId;

    // Get all quizzes created by educator
    const quizzes = await Quiz.find({ createdBy: educatorId });
    const quizIds = quizzes.map(q => q._id);

    // Get all attempts for these quizzes
    const attempts = await QuizAttempt.find({ 
      quizId: { $in: quizIds },
      status: { $in: ['completed', 'graded'] }
    });

    const totalAttempts = attempts.length;
    
    if (totalAttempts === 0) {
      return res.json({
        success: true,
        stats: {
          totalAttempts: 0,
          avgScore: 0,
          passRate: 0
        }
      });
    }

    // Calculate average score
    const totalScore = attempts.reduce((sum, attempt) => 
      sum + (attempt.scoring?.scorePercentage || 0), 0
    );
    const avgScore = totalScore / totalAttempts;

    // Calculate pass rate
    const passedAttempts = attempts.filter(attempt => 
      attempt.scoring?.passed === true
    ).length;
    const passRate = (passedAttempts / totalAttempts) * 100;

    res.json({
      success: true,
      stats: {
        totalAttempts,
        avgScore,
        passRate
      }
    });
  } catch (error) {
    console.error('Get educator quiz stats error:', error);
    res.json({ success: false, message: error.message });
  }
};

// Get detailed student quiz attempts for educator
const getStudentQuizAttempts = async (req, res) => {
  try {
    const educatorId = req.userId;

    // Find all quizzes by this educator
    const quizzes = await Quiz.find({ createdBy: educatorId });
    const quizIds = quizzes.map(q => q._id);

    // Find all attempts for these quizzes
    const attempts = await QuizAttempt.find({
      quizId: { $in: quizIds },
      status: { $in: ['completed', 'graded'] }
    }).populate('quizId', 'title courseId').lean();

    // Group attempts by student
    const studentAttemptsMap = {};
    
    for (const attempt of attempts) {
      const studentId = attempt.studentId;
      
      if (!studentAttemptsMap[studentId]) {
        studentAttemptsMap[studentId] = {
          studentId,
          attempts: [],
          totalAttempts: 0,
          avgScore: 0,
          bestScore: 0,
          lastAttemptDate: null
        };
      }

      studentAttemptsMap[studentId].attempts.push({
        attemptId: attempt._id,
        quizTitle: attempt.quizId?.title || 'Unknown Quiz',
        courseId: attempt.quizId?.courseId,
        score: attempt.scoring?.scorePercentage || 0,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        passed: attempt.scoring?.passed || false
      });
    }

    // Calculate statistics for each student
    const studentAttempts = Object.values(studentAttemptsMap).map(student => {
      student.totalAttempts = student.attempts.length;
      student.avgScore = student.totalAttempts > 0
        ? student.attempts.reduce((sum, att) => sum + att.score, 0) / student.totalAttempts
        : 0;
      student.bestScore = student.totalAttempts > 0
        ? Math.max(...student.attempts.map(att => att.score))
        : 0;
      student.lastAttemptDate = student.totalAttempts > 0
        ? new Date(Math.max(...student.attempts.map(att => new Date(att.submittedAt))))
        : null;
      student.passedCount = student.attempts.filter(att => att.passed).length;

      return student;
    });

    // Fetch student information from Clerk
    const { clerkClient } = await import('@clerk/express');
    
    for (const student of studentAttempts) {
      try {
        const user = await clerkClient.users.getUser(student.studentId);
        student.studentName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
        student.studentEmail = user.emailAddresses?.[0]?.emailAddress || 'N/A';
        student.studentImage = user.imageUrl || '';
      } catch (error) {
        console.error(`Error fetching user ${student.studentId}:`, error);
        student.studentName = 'Unknown Student';
        student.studentEmail = 'N/A';
        student.studentImage = '';
      }
    }

    // Sort by total attempts (descending)
    studentAttempts.sort((a, b) => b.totalAttempts - a.totalAttempts);

    res.json({
      success: true,
      studentAttempts
    });

  } catch (error) {
    console.error('Get student quiz attempts error:', error);
    res.json({ success: false, message: error.message });
  }
};

export {
  createQuiz,
  uploadQuizFromExcel,
  getCourseQuizzes,
  getPublishedQuizzes,
  getQuizForTaking,
  submitQuizAttempt,
  getQuizAttempt,
  getAttemptForGrading,
  gradeAttempt,
  getEducatorQuizStats,
  getStudentQuizAttempts,
  getQuizDetails,
  updateQuiz,
  deleteQuiz,
  toggleQuizPublish,
  getQuizSubmissions,
  downloadExcelTemplate
};
