import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: false // Optional, can get from Quiz
  },
  
  // Attempt Info
  attemptNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'completed', 'pending', 'graded'],
    default: 'in-progress'
  },
  
  // Timing
  startedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: {
    type: Date,
    default: null
  },
  timeSpent: {
    type: Number, // seconds
    default: 0
  },
  isLateSubmission: {
    type: Boolean,
    default: false
  },
  
  // Answers
  answers: [{
    questionId: {
      type: String,
      required: true
    },
    answer: mongoose.Schema.Types.Mixed, // Can be string (optionId, text) or any format
    isCorrect: {
      type: Boolean,
      default: null
    },
    pointsEarned: {
      type: Number,
      default: null
    },
    feedback: {
      type: String,
      default: ''
    }
  }],
  
  // Scoring
  scoring: {
    totalPoints: {
      type: Number,
      default: 0
    },
    pointsEarned: {
      type: Number,
      default: null
    },
    scorePercentage: {
      type: Number,
      default: null
    },
    passed: {
      type: Boolean,
      default: null
    }
  },
  
  // Grading
  autoGraded: {
    type: Boolean,
    default: false
  },
  gradedBy: {
    type: String,
    default: null
  },
  gradedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
quizAttemptSchema.index({ quizId: 1, studentId: 1, attemptNumber: 1 });
quizAttemptSchema.index({ studentId: 1, status: 1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;
