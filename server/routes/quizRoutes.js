import express from 'express';
import multer from 'multer';
import {
  createQuiz,
  uploadQuizFromExcel,
  getCourseQuizzes,
  getPublishedQuizzes,
  getQuizDetails,
  getQuizForTaking,
  submitQuizAttempt,
  getQuizAttempt,
  getAttemptForGrading,
  gradeAttempt,
  getEducatorQuizStats,
  getStudentQuizAttempts,
  getMyAttempts,
  updateQuiz,
  deleteQuiz,
  toggleQuizPublish,
  getQuizSubmissions,
  downloadExcelTemplate
} from '../controllers/quizController.js';
import { protectEducator, protectRoute } from '../middlewares/authMiddleware.js';

const quizRouter = express.Router();

// Configure multer for Excel upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Quiz management routes (Educator only)
quizRouter.post('/create', protectEducator, createQuiz);
quizRouter.post('/upload-excel', protectEducator, upload.single('file'), uploadQuizFromExcel);
quizRouter.get('/stats/educator', protectEducator, getEducatorQuizStats); // Get educator quiz stats
quizRouter.get('/stats/student-attempts', protectEducator, getStudentQuizAttempts); // Get student quiz attempts
quizRouter.get('/my-attempts', protectRoute, getMyAttempts); // Get my quiz attempts (student)
quizRouter.get('/course/:courseId', protectEducator, getCourseQuizzes);
quizRouter.get('/course/:courseId/published', getPublishedQuizzes); // For students
quizRouter.get('/:quizId/take', getQuizForTaking); // For students to take quiz
quizRouter.post('/:quizId/submit', submitQuizAttempt); // Submit quiz attempt
quizRouter.get('/attempt/:attemptId', getQuizAttempt); // Get quiz attempt result
quizRouter.get('/attempt/:attemptId/grade', protectEducator, getAttemptForGrading); // Get attempt for grading
quizRouter.patch('/attempt/:attemptId/grade', protectEducator, gradeAttempt); // Save grades
quizRouter.get('/:quizId', protectEducator, getQuizDetails);
quizRouter.put('/:quizId', protectEducator, updateQuiz);
quizRouter.delete('/:quizId', protectEducator, deleteQuiz);
quizRouter.patch('/:quizId/publish', protectEducator, toggleQuizPublish);
quizRouter.get('/:quizId/submissions', protectEducator, getQuizSubmissions);
quizRouter.get('/template/download', downloadExcelTemplate);

export default quizRouter;
