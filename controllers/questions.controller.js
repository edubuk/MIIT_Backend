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
export const evaluateAnswer = async (req, res) => {
  try {
    const { userAnswers, stage } = req.body;
    console.log("stage is ", stage);
    console.log("userAnswers", userAnswers);
    return res.status(200).json({
      success: true,
      message: "Answer evaluated successfully",
      userAnswers,
    });
  } catch (error) {
    console.error(
      "Error evaluating answer in EVALUATE ANSWER CONTROLLER",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate answer",
      error,
    });
  }
};
