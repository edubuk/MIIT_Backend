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
      message: "Questions fetched successfully",
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
