import axios from "axios";

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

    //  store infos in database;
    return res.status(200).json({
      success: true,
      message: "Answer evaluated successfully",
      data: {
        top3Intelligences,
        allIntelligenceScores: Object.values(intelligenceScores),
        statistics: {
          totalQuestions,
          completedQuestions,
          timedOutQuestions,
          averageTimeTaken: Math.round(averageTimeTaken * 1000) / 1000, // Round to 3 decimal places
          completionRate:
            Math.round((completedQuestions / totalQuestions) * 100 * 100) / 100, // Percentage with 2 decimal places
        },
        stage,
        evaluationRules: testEvaluationRules.find(
          (rule) => rule.stage === stage
        ),
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

// Example usage function for testing
export const testEvaluation = () => {
  const sampleQuestions = [
    {
      questionId: 1,
      question: "I do NOT like spending time with myself",
      QuestionType: "NEGATIVE",
      intelligenceType: "Intrapersonal",
    },
    {
      questionId: 2,
      question: "I enjoy working with numbers",
      QuestionType: "POSITIVE",
      intelligenceType: "Logical-Mathematical",
    },
    {
      questionId: 3,
      question: "I have trouble understanding others' emotions",
      QuestionType: "NEGATIVE",
      intelligenceType: "Interpersonal",
    },
  ];

  const sampleAnswers = [
    {
      questionId: 1,
      question: "I do NOT like spending time with myself",
      intelligenceType: "Intrapersonal",
      selectedAnswer: "Strongly Agree",
      selectedAnswerIndex: 0,
      timeTaken: 1.768,
      wasTimedOut: false,
      status: "completed",
    },
    {
      questionId: 2,
      question: "I enjoy working with numbers",
      intelligenceType: "Logical-Mathematical",
      selectedAnswer: "Strongly Agree",
      selectedAnswerIndex: 0,
      timeTaken: 2.1,
      wasTimedOut: false,
      status: "completed",
    },
    {
      questionId: 3,
      question: "I have trouble understanding others' emotions",
      intelligenceType: "Interpersonal",
      selectedAnswer: "Disagree",
      selectedAnswerIndex: 3,
      timeTaken: 1.5,
      wasTimedOut: false,
      status: "completed",
    },
  ];

  const intelligenceScores = calculateIntelligenceScores(
    sampleAnswers,
    sampleQuestions,
    2
  );
  const top3 = getTop3Intelligences(intelligenceScores);

  console.log("Sample Evaluation Results:");
  console.log("Top 3 Intelligences:", top3);
  console.log("All Intelligence Scores:", intelligenceScores);

  return { top3, intelligenceScores };
};
