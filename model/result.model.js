import mongoose from "mongoose";

const userAnswerSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true,
  },
  questionType: {
    type: String,
    default: "NOT_REQUIRED_STAGE_1&3",
  },
  question: {
    type: String,
    required: true,
  },
  intelligenceType: {
    type: String,
    required: true,
  },
  selectedAnswer: {
    type: String,
    default: null,
  },
  selectedAnswerIndex: {
    type: Number,
    default: null,
  },
  timeTaken: {
    type: Number,
    required: true,
  },
  wasTimedOut: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["completed", "not_attempted", "pending"],
    default: "pending",
  },
});

const intelligenceScoreSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  totalScore: {
    type: Number,
    required: true,
    default: 0,
  },
  questionCount: {
    type: Number,
    required: true,
    default: 0,
  },
  averageScore: {
    type: Number,
    required: true,
    default: 0,
  },
});

const top3IntelligenceSchema = new mongoose.Schema({
  rank: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
  },
  intelligenceType: {
    type: String,
    required: true,
  },
  totalScore: {
    type: Number,
    required: true,
    default: 0,
  },
  averageScore: {
    type: Number,
    required: true,
    default: 0,
  },
  questionCount: {
    type: Number,
    required: true,
    default: 0,
  },
});

const statisticsSchema = new mongoose.Schema({
  totalQuestions: {
    type: Number,
    required: true,
    default: 10,
  },
  completedQuestions: {
    type: Number,
    required: true,
    default: 0,
  },
  timedOutQuestions: {
    type: Number,
    required: true,
    default: 0,
  },
  averageTimeTaken: {
    type: Number,
    required: true,
    default: 0,
  },
});

const evaluationRulesSchema = new mongoose.Schema({
  stage: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
  },
  rules: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {},
  },
});

const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    stage: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    answers: {
      type: [userAnswerSchema],
      required: true,
    },
    averageTime: {
      type: Number,
      default: 0,
    },
    timedOutCount: {
      type: Number,
      default: 0,
    },
    top3Intelligences: {
      type: [top3IntelligenceSchema],
      required: true,
      validate: {
        validator: function (intelligences) {
          return intelligences.length <= 3;
        },
        message: "Cannot have more than 3 top intelligences",
      },
    },
    allIntelligenceScores: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    interestTestResult: {
      type: mongoose.Schema.Types.Mixed,
      // required: true,
      default: {},
    },
    statistics: {
      type: statisticsSchema,
      required: true,
    },
  },
  { timestamps: true }
);

export const Result = mongoose.model("Result", resultSchema);
