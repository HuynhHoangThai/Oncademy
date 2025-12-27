import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  pathwayId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PathwayCourse',
    default: null
  },
  chapterId: {
    type: String,
    default: null
  },
  lectureId: {
    type: String,
    default: null
  },

  quizTitle: {
    type: String,
    required: true
  },
  quizDescription: {
    type: String,
    default: ''
  },
  quizType: {
    type: String,
    enum: ['quiz', 'assignment', 'final-exam'],
    default: 'quiz'
  },

  // Timing & Access
  duration: {
    type: Number, // minutes
    default: 30
  },
  startDate: {
    type: Date,
    default: null
  },
  deadline: {
    type: Date,
    default: null
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  lateSubmissionPenalty: {
    type: Number, // percentage
    default: 0
  },

  // Attempt Settings
  maxAttempts: {
    type: Number,
    default: 0 // 0 = unlimited
  },
  passingScore: {
    type: Number, // percentage
    default: 70
  },

  // Questions
  questions: [{
    questionId: {
      type: String,
      required: true
    },
    questionType: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'essay', 'fill-blank'],
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    questionImage: {
      type: String,
      default: null
    },
    points: {
      type: Number,
      required: true,
      default: 1
    },

    // For Multiple Choice & True/False
    options: [{
      optionId: String,
      optionText: String,
      isCorrect: Boolean
    }],

    // For True/False
    correctAnswer: {
      type: Boolean,
      default: null
    },

    // For Essay
    maxWords: {
      type: Number,
      default: null
    },
    rubric: {
      type: String,
      default: ''
    },

    // For Fill in the Blank
    correctAnswers: [{
      type: String
    }],
    caseSensitive: {
      type: Boolean,
      default: false
    },

    // Explanation
    explanation: {
      type: String,
      default: ''
    }
  }],

  // Settings
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  shuffleOptions: {
    type: Boolean,
    default: false
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  showScoreImmediately: {
    type: Boolean,
    default: true
  },

  // Metadata
  totalPoints: {
    type: Number,
    required: true,
    default: 0
  },
  createdBy: {
    type: String,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate total points before saving
quizSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
  }
  next();
});

// Add indexes for better query performance
quizSchema.index({ courseId: 1, isPublished: 1 });
quizSchema.index({ pathwayId: 1, isPublished: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ courseId: 1, chapterId: 1 });
quizSchema.index({ courseId: 1, lectureId: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
