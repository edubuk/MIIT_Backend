import axios from "axios";

export const getQuestionsStage1 = async (req, res) => {
  try {
    const response = await axios.get(process.env.SHEET_TEST_STAGE_1);
    const rawData = response.data;

    const structuredData = rawData.map((row) => ({
      // id: row["S. No"],
      questionId: parseInt(row["S. No"]),
      question: row["Questions for Level 1 Exam (Class 6, 7, 8 & 9)"],
      intelligenceType: row["Intelligence-Type"],
      options: ["Yes", "May Be", "No"],

      // options: {
      //   yes: parseInt(row["Yes"]),
      //   maybe: parseInt(row["May Be"]),
      //   no: parseInt(row["No"]),
      // },
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
      questionId: parseInt(row["S. No."]),
      question: row["Questions for Level 2 Exams (Class 10, 11, 12)"],
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

    const structuredData = [];
    let questionId = 1;

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (row["S. N."].startsWith("Q")) {
        const question = row["Question"];
        const intelligenceType = row["Intelligence-Type"];
        const options = [];

        let j = i + 1;
        while (j < rawData.length) {
          const nextRow = rawData[j];
          const s_n = nextRow["S. N."]?.toLowerCase();

          if (["a", "b", "c", "d", "e"].includes(s_n)) {
            if (nextRow["Question"]) {
              options.push(nextRow["Question"].trim());
            }
            j++;
          } else if (!s_n) {
            j++; // skip blank rows
          } else {
            break;
          }
        }

        structuredData.push({
          questionId,
          question: question.trim(),
          intelligenceType: intelligenceType ? intelligenceType.trim() : "",
          options,
        });

        questionId++;
        i = j - 1; // move index to last read
      }
    }

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
