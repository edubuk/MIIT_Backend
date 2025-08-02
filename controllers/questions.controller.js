import axios from "axios";
import JWT from "jsonwebtoken";
import { Result } from "../model/result.model.js";
import { registration } from "../model/userModel.js";

export const getQuestionsStage1 = async (req, res) => {
  try {
    const response = await axios.get(process.env.SHEET_TEST_STAGE_1);
    const rawData = response.data;

    const structuredData = rawData.map((row) => ({
      // id: row["S. No"],
      questionId: parseInt(row["S. No"]),
      question: row["Questions"],
      intelligenceType: row["Intelligence-Type"],
      options: ["Yes", "May Be", "No"],
    }));

    return res.status(200).json({
      success: true,
      message: "Questions fetched successfully testStage1",
      data: structuredData,
    });
  } catch (error) {
    console.error("Error fetching data from Google Sheet", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions stage 1",
      error,
    });
  }
};

export const getQuestionsStage2 = async (req, res) => {
  try {
    const response = await axios.get(process.env.SHEET_TEST_STAGE_2);
    const rawData = response.data;

    const structuredData = rawData.map((row) => ({
      // id: row["S. No"],
      questionId: parseInt(row["S. No"]),
      question: row["Questions"],
      QuestionType: row["Question Type"],
      intelligenceType: row["Intelligence-Type"],
      options: [
        "Strongly Agree",
        "Agree",
        "May Be/ Neutral",
        "Disagree",
        "Strongly Disagree",
      ],

      // options: {
      //   yes: parseInt(row["Yes"]),
      //   maybe: parseInt(row["May Be"]),
      //   no: parseInt(row["No"]),
      // },
    }));

    return res.status(200).json({
      success: true,
      message: "Questions fetched successfully testStage2",
      rawData,
      data: structuredData,
    });
  } catch (error) {
    console.error("Error fetching data from Google Sheet", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions stage 2",
      error,
    });
  }
};

export const getQuestionsStage3 = async (req, res) => {
  try {
    const response = await axios.get(process.env.SHEET_TEST_STAGE_3);
    const rawData = response.data;

    const structuredData = rawData.map((row) => ({
      // id: row["S. No"],
      questionId: parseInt(row["S. No"]),
      question: row["Questions"],
      intelligenceType: row["Intelligence-Type"],
      options: [row["Option A"], row["Option B"], row["Option C"]],
    }));

    return res.status(200).json({
      success: true,
      message: "Structured questions fetched successfully for stage 3",
      data: structuredData,
    });
  } catch (error) {
    console.error("Error processing stage 3 questions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch structured questions",
      error: error.message,
    });
  }
};

//test
const testEvaluationRules = [
  {
    stage: 1,
    rules: {
      0: 10, // marks
      1: 5,
      2: 0,
    },
  },
  {
    stage: 2,
    rules: {
      negative: {
        0: 0,
        1: 5,
        2: 10,
        3: 15,
        4: 20,
      },
      positive: {
        0: 20,
        1: 15,
        2: 10,
        3: 5,
        4: 0,
      },
    },
  },
  {
    stage: 3,
    rules: {
      0: 10,
      1: 0,
      2: 5,
    },
  },
];

// Helper function to get score based on stage and question type
const getScore = (stage, questionType, selectedAnswerIndex) => {
  const stageRules = testEvaluationRules.find((rule) => rule.stage === stage);

  if (!stageRules) {
    throw new Error(`No rules found for stage ${stage}`);
  }

  if (stage === 2) {
    // As Stage 2 has different rules for positive and negative questions
    const questionTypeKey =
      questionType?.toLowerCase() === "negative" ? "negative" : "positive";
    return stageRules.rules[questionTypeKey][selectedAnswerIndex] || 0;
  } else {
    // Stage 1 and 3 have simple index-based rules
    return stageRules.rules[selectedAnswerIndex] || 0;
  }
};

// Function to evaluate all answers and calculate intelligence scores
const calculateIntelligenceScores = (userAnswers, stage) => {
  // NOTE:TODO: CHECK THISE FUNCTION WHERE IT IS CALLED WHETHER IT IS ACCEPTING THE SECOND PARAMETER AS QUESTIONS IF YES THEN REMOVE IT//YASH
  const intelligenceScores = {};

  userAnswers.forEach((answer) => {
    // Calculate score for this answer
    const score = getScore(
      stage,
      answer.questionType,
      answer.selectedAnswerIndex
    );

    // Add score to the corresponding intelligence type
    const intelligenceType = answer.intelligenceType;

    if (!intelligenceScores[intelligenceType]) {
      intelligenceScores[intelligenceType] = {
        type: intelligenceType,
        totalScore: 0,
        questionCount: 0,
        averageScore: 0,
      };
    }

    intelligenceScores[intelligenceType].totalScore += score;
    intelligenceScores[intelligenceType].questionCount += 1;
  });

  // Calculate average scores
  Object.keys(intelligenceScores).forEach((type) => {
    const intel = intelligenceScores[type];
    intel.averageScore = intel.totalScore / intel.questionCount;
  });

  return intelligenceScores;
};

// Function to get top 3 intelligence types
const getTop3Intelligences = (intelligenceScores) => {
  return Object.values(intelligenceScores)
    .sort((a, b) => b.totalScore - a.totalScore) // Sort by total score descending
    .slice(0, 3) // Get top 3
    .map((intel, index) => ({
      rank: index + 1,
      intelligenceType: intel.type,
      totalScore: intel.totalScore,
      averageScore: Math.round(intel.averageScore * 100) / 100, // Round to 2 decimal places
      questionCount: intel.questionCount,
    }));
};

export const evaluateAnswer = async (req, res) => {
  try {
    const { userAnswers, stage } = req.body;
    const { authToken } = req.cookies;

    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "JWT SECRET KEY NOT FOUND",
      });
    }
    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request , sign in to continue",
      });
    }
    const decodedToken = JWT.verify(authToken, process.env.JWT_SECRET_KEY);
    const userId = decodedToken._id;
    const user = await registration.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Not valid user",
      });
    }
    // Validation
    if (!userAnswers || !Array.isArray(userAnswers)) {
      return res.status(400).json({
        success: false,
        message: "userAnswers is required and must be an array",
      });
    }

    if (!stage || ![1, 2, 3].includes(stage)) {
      return res.status(400).json({
        success: false,
        message: "stage is required and must be 1, 2, or 3",
      });
    }

    console.log("Stage:", stage);
    console.log("Number of answers:", userAnswers.length);

    // Calculate intelligence scores
    const intelligenceScores = calculateIntelligenceScores(userAnswers, stage);

    // Get top 3 intelligences
    const top3Intelligences = getTop3Intelligences(intelligenceScores);

    // Calculate overall statistics
    const totalQuestions = userAnswers.length;
    const completedQuestions = userAnswers.filter(
      (answer) => answer.status === "completed"
    ).length;
    const timedOutQuestions = userAnswers.filter(
      (answer) => answer.wasTimedOut
    ).length;
    const averageTimeTaken =
      userAnswers.reduce((sum, answer) => sum + (answer.timeTaken || 0), 0) /
      totalQuestions;

    // storing result into the database;
    const result = await Result.create({
      userId,
      stage,
      answers: userAnswers,
      averageTime: averageTimeTaken,
      timedOutCount: timedOutQuestions,
      intelligenceScores,
      top3Intelligences,
      allIntelligenceScores: intelligenceScores,
      statistics: {
        totalQuestions,
        completedQuestions,
        timedOutQuestions,
        averageTimeTaken: Math.round(averageTimeTaken * 1000) / 1000, // Round to 3 decimal places
      },
    });

    //  store infos in database;
    return res.status(200).json({
      success: true,
      message: "Answer evaluated successfully",
      result_id: result._id,
      data: {
        top3Intelligences,
        allIntelligenceScores: Object.values(intelligenceScores),
        statistics: {
          totalQuestions,
          completedQuestions,
          timedOutQuestions,
          averageTimeTaken: Math.round(averageTimeTaken * 1000) / 1000, // Round to 3 decimal places
        },
        stage,
      },
    });
  } catch (error) {
    console.error(
      "Error evaluating answer in EVALUATE ANSWER CONTROLLER",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate answer",
      error: error.message,
    });
  }
};

export const getInterestTestQuestions = async (req, res) => {
  try {
    if (!process.env.SHEET_INTEREST_TEST) {
      return res.status(500).json({
        success: false,
        message: "NO ENV FOUND FOR INTEREST TEST SHEET",
      });
    }
    const response = await axios.get(process.env.SHEET_INTEREST_TEST);
    const rawData = response.data;

    const structuredData = rawData.map((row) => ({
      // id: row["S. No"],
      questionId: parseInt(row["S. No"]),
      question: row["Questions"],
      interestType: row["Interest Type"],
      options: ["Yes", "May Be", "No"],
    }));

    return res.status(200).json({
      success: true,
      message: "Questions fetched successfully interest test",
      data: structuredData,
    });
  } catch (error) {
    console.error("Error fetching data from Google Sheet", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions for interest test",
      error,
    });
  }
};

// ---------------------------------------------------------------------------------
// Helper function to get score based on stage and question type
const getScoreForInterestTest = (selectedAnswerIndex) => {
  const stageRules = testEvaluationRules[0];

  if (!stageRules) {
    throw new Error(`No rules found for interest test similar to stage1`);
  }

  return stageRules.rules[selectedAnswerIndex] || 0;
};

// Function to evaluate all answers and calculate intelligence scores
const calculateIntelligenceScoresForInterestTest = (userAnswers) => {
  // NOTE:TODO: CHECK THISE FUNCTION WHERE IT IS CALLED WHETHER IT IS ACCEPTING THE SECOND PARAMETER AS QUESTIONS IF YES THEN REMOVE IT//YASH
  const interestScores = {};

  userAnswers.forEach((answer) => {
    // Calculate score for this answer
    const score = getScoreForInterestTest(answer.selectedAnswerIndex);

    // Add score to the corresponding intelligence type
    const interestType = answer.interestType;

    if (!interestScores[interestType]) {
      interestScores[interestType] = {
        type: interestType,
        totalScore: 0,
        questionCount: 0,
        averageScore: 0,
      };
    }

    interestScores[interestType].totalScore += score;
    interestScores[interestType].questionCount += 1;
  });

  // Calculate average scores
  Object.keys(interestScores).forEach((type) => {
    const interest = interestScores[type];
    interest.averageScore = interest.totalScore / interest.questionCount;
  });

  return interestScores;
};

// Evaluate interest test questions;
export const evaluateAnswerForInterestTest = async (req, res) => {
  try {
    const { userAnswers } = req.body;
    const { result_id } = req.params;
    const { authToken } = req.cookies;

    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "JWT SECRET KEY NOT FOUND",
      });
    }
    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request , sign in to continue",
      });
    }
    if (!result_id) {
      return res.status(400).json({
        success: false,
        message: "result_id is required",
      });
    }
    const decodedToken = JWT.verify(authToken, process.env.JWT_SECRET_KEY);
    const userId = decodedToken._id;
    const user = await registration.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Not valid user",
      });
    }
    // Validation
    if (!userAnswers || !Array.isArray(userAnswers)) {
      return res.status(400).json({
        success: false,
        message: "userAnswers is required and must be an array",
      });
    }

    console.log("Number of answers:", userAnswers.length);

    // Calculate intelligence scores
    const interestScores =
      calculateIntelligenceScoresForInterestTest(userAnswers);

    // Get top 3 intelligences
    const top3Interests = getTop3Intelligences(interestScores);

    // Calculate overall statistics
    const totalQuestions = userAnswers.length;
    const completedQuestions = userAnswers.filter(
      (answer) => answer.status === "completed"
    ).length;
    const timedOutQuestions = userAnswers.filter(
      (answer) => answer.wasTimedOut
    ).length;
    const averageTimeTaken =
      userAnswers.reduce((sum, answer) => sum + (answer.timeTaken || 0), 0) /
      totalQuestions;
    let data = {
      top3Interests,
      allInterestScores: Object.values(interestScores),
      statistics: {
        totalQuestions,
        completedQuestions,
        timedOutQuestions,
        averageTimeTaken: Math.round(averageTimeTaken * 1000) / 1000, // Round to 3 decimal places
      },
      // stage,
    };
    // storing result into the database;

    const updatedResult = await Result.findByIdAndUpdate(
      result_id,
      {
        $set: {
          interestTestResult: data,
        },
      },
      { new: true }
    );
    //  store infos in database;
    return res.status(200).json({
      success: true,
      message: "Answer evaluated successfully",
      databaseResult: updatedResult,
      data,
    });
  } catch (error) {
    console.error(
      "Error evaluating answer in INTEREST TEST ANSWER CONTROLLER",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate answer for interest test",
      error: error.message,
    });
  }
};
