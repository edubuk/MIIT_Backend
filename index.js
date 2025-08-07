import express from "express";
import { configDotenv } from "dotenv";
import dbConnection from "./config/db-connection.js";
import cors from "cors";
//import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import paymentRouter from "./routes/userRoutes.js";
import questionsRouter from "./routes/questions.route.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import xlsx from "xlsx";
import { GoogleGenerativeAI } from "@google/generative-ai";
const app = express();

configDotenv();
const mongoURI = process.env.MONGO_URI;
dbConnection(mongoURI);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 2048,
  },
});
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://www.edubukmiitscreening.com",
      "https://edubukmiitscreening.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ES module workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Excel file
const filePath = path.join(__dirname, "Career path.xlsx");
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);
const result = {
  top3Intelligences: [
    {
      rank: 1,
      intelligenceType: "Bodily-Kinesthetic",
      totalScore: 25,
      averageScore: 12.5,
      questionCount: 2,
      _id: {
        $oid: "688dc4bff6b338f0722c3578",
      },
    },
    {
      rank: 2,
      intelligenceType: "Logical-Mathematical",
      totalScore: 25,
      averageScore: 12.5,
      questionCount: 2,
      _id: {
        $oid: "688dc4bff6b338f0722c3579",
      },
    },
    {
      rank: 3,
      intelligenceType: "Musical",
      totalScore: 20,
      averageScore: 10,
      questionCount: 2,
      _id: {
        $oid: "688dc4bff6b338f0722c357a",
      },
    },
  ],
  interestTestResult: {
    top3Interests: [
      {
        rank: 1,
        intelligenceType: "Investigative",
        totalScore: 15,
        averageScore: 7.5,
        questionCount: 2,
      },
      {
        rank: 2,
        intelligenceType: "Social",
        totalScore: 15,
        averageScore: 7.5,
        questionCount: 2,
      },
      {
        rank: 3,
        intelligenceType: "Artistic",
        totalScore: 10,
        averageScore: 3.33,
        questionCount: 3,
      },
    ],
    allInterestScores: [
      {
        type: "Artistic",
        totalScore: 10,
        questionCount: 3,
        averageScore: 3.3333333333333335,
      },
      {
        type: "Investigative",
        totalScore: 15,
        questionCount: 2,
        averageScore: 7.5,
      },
      {
        type: "Social",
        totalScore: 15,
        questionCount: 2,
        averageScore: 7.5,
      },
      {
        type: "Enterprising",
        totalScore: 10,
        questionCount: 1,
        averageScore: 10,
      },
      {
        type: "Realistic",
        totalScore: 10,
        questionCount: 2,
        averageScore: 5,
      },
    ],
    statistics: {
      totalQuestions: 10,
      completedQuestions: 10,
      timedOutQuestions: 0,
      averageTimeTaken: 1.217,
    },
  },
};

// POST endpoint
app.post("/get-career-path", (req, res) => {
  const { combination } = req.body;

  if (!combination) {
    return res.status(400).json({ error: "Missing combination input" });
  }

  const normalizeAndSort = (str) =>
    str
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .sort()
      .join(",");

  const match = data.find(
    (row) =>
      normalizeAndSort(row["Intelligence + 3 Interest Types"]) ===
      normalizeAndSort(combination)
  );

  if (match) {
    return res.json({
      careerPath: match["Career Path - Final"],
      // combinationTest,
    });
  } else {
    return res.status(404).json({
      message: "Career path not found for the given combination",
    });
  }
});

const normalizeIntelligenceType = (str) => {
  return str.replace(/-/g, " "); // Replace hyphens with spaces
};
export const getCareerPath = async (combination) => {
  try {
    if (!combination) {
      throw new Error("Combination is required in getCareerPath");
    }

    const normalizeAndSort = (str) =>
      str
        .split(",")
        .map((s) => normalizeIntelligenceType(s.trim()).toLowerCase())
        .sort()
        .join(",");

    const match = data.find(
      (row) =>
        normalizeAndSort(row["Intelligence + 3 Interest Types"]) ===
        normalizeAndSort(combination)
    );

    return match ? match["Career Path - Final"] : null;
  } catch (error) {
    console.log("ERROR:WHILE GETTING CAREER PATH", error);
    return null;
  }
};

//

app.post("/test", async (req, res) => {
  try {
    const {
      careerPaths,
      top3Intelligences,
      top3Interests,
      // userDetails = {},
    } = req.body;

    const systemPrompt = `
You are a friendly career counselor helping students aged 12-18 explore careers. Write in simple, encouraging language that students can easily understand. MUST return your response as a valid JSON object with the EXACT structure specified below. Do not include any markdown formatting, explanations, or text outside the JSON structure.

REQUIRED JSON STRUCTURE (you must follow this exactly):
{
  "assessmentAnalysis": {
    "currentSuggestionsAnalysis": {
      "[career_name_1]": {
        "alignment": "string - Why this career matches you (student-friendly explanation)",
        "challenges": "string - What might be tough about this job (honest but encouraging)",
        "successStrategies": "string - How you can succeed in this career (actionable advice)"
      },
      "[career_name_2]": {
        "alignment": "string - Why this career matches you (student-friendly explanation)", 
        "challenges": "string - What might be tough about this job (honest but encouraging)",
        "successStrategies": "string - How you can succeed in this career (actionable advice)"
      },
      "[career_name_3]": {
        "alignment": "string - Why this career matches you (student-friendly explanation)",
        "challenges": "string - What might be tough about this job (honest but encouraging)", 
        "successStrategies": "string - How you can succeed in this career (actionable advice)"
      }
    },
    "additionalRecommendations": [
      {
        "career": "string - Career name",
        "fitExplanation": "string - Why this job is perfect for someone like you (enthusiastic, clear explanation)",
        "challenges": "string - What you should know before choosing this path (realistic but supportive)",
        "successStrategies": "string - Steps you can take now to prepare for this career (specific, actionable advice)"
      },
      {
        "career": "string - Career name",
        "fitExplanation": "string - Why this job is perfect for someone like you (enthusiastic, clear explanation)", 
        "challenges": "string - What you should know before choosing this path (realistic but supportive)",
        "successStrategies": "string - Steps you can take now to prepare for this career (specific, actionable advice)"
      },
      {
        "career": "string - Career name",
        "fitExplanation": "string - Why this job is perfect for someone like you (enthusiastic, clear explanation)",
        "challenges": "string - What you should know before choosing this path (realistic but supportive)", 
        "successStrategies": "string - Steps you can take now to prepare for this career (specific, actionable advice)"
      },
      {
        "career": "string - Career name",
        "fitExplanation": "string - Why this job is perfect for someone like you (enthusiastic, clear explanation)",
        "challenges": "string - What you should know before choosing this path (realistic but supportive)",
        "successStrategies": "string - Steps you can take now to prepare for this career (specific, actionable advice)" 
      },
      {
        "career": "string - Career name",
        "fitExplanation": "string - Why this job is perfect for someone like you (enthusiastic, clear explanation)",
        "challenges": "string - What you should know before choosing this path (realistic but supportive)",
        "successStrategies": "string - Steps you can take now to prepare for this career (specific, actionable advice)"
      }
    ]
  }
}

WRITING STYLE REQUIREMENTS:
- Use simple, clear language (avoid jargon and complex terms)
- Be encouraging and positive while staying realistic
- Use "you" to speak directly to the student
- Include specific actions students can take NOW (join clubs, take classes, practice skills)
- Mention school subjects that connect to each career
- Keep explanations 1-2 sentences per field
- Make it exciting - help students see the cool parts of each job!

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown code blocks
- Use the exact key names shown above
- Provide exactly 5 additional recommendations
- Replace [career_name_X] with actual lowercase career names from the input (e.g., "doctor", "bookingAgent", "newscaster")
- Ensure all strings are properly escaped for JSON
`;

    const userPrompt = `
Analyze this assessment data and provide career recommendations:

CURRENT SUGGESTED CAREERS: ${careerPaths.join(", ")}

TOP 3 INTELLIGENCES:
${top3Intelligences
  .map(
    (intel) =>
      `${intel.rank}. ${intel.intelligenceType} (Score: ${intel.totalScore}, Avg: ${intel.averageScore})`
  )
  .join("\n")}

TOP 3 INTERESTS:
${top3Interests
  .map(
    (interest) =>
      `${interest.rank}. ${interest.intelligenceType} (Score: ${interest.totalScore}, Avg: ${interest.averageScore})`
  )
  .join("\n")}
`;

    // Combine system and user prompts
    const fullPrompt = systemPrompt + "\n\n" + userPrompt;

    const result = await model.generateContent(fullPrompt);
    let responseText = result.response.text().trim();

    // More robust JSON extraction
    try {
      // Remove any markdown code blocks
      responseText = responseText
        .replace(/^```json\s*/, "")
        .replace(/```$/, "");

      // Find JSON object boundaries
      const startIndex = responseText.indexOf("{");
      const lastIndex = responseText.lastIndexOf("}");

      if (startIndex !== -1 && lastIndex !== -1) {
        responseText = responseText.substring(startIndex, lastIndex + 1);
      }

      const jsonData = JSON.parse(responseText);

      // Validate the structure
      if (
        !jsonData.assessmentAnalysis ||
        !jsonData.assessmentAnalysis.currentSuggestionsAnalysis ||
        !jsonData.assessmentAnalysis.additionalRecommendations ||
        !Array.isArray(jsonData.assessmentAnalysis.additionalRecommendations) ||
        jsonData.assessmentAnalysis.additionalRecommendations.length !== 5
      ) {
        throw new Error("Invalid JSON structure returned from AI");
      }

      res.json({
        success: true,
        type: "career_recommendations",
        analysis: jsonData,
        metadata: {
          topIntelligence: top3Intelligences[0].intelligenceType,
          topInterest: top3Interests[0].intelligenceType,
          totalAssessmentScore: top3Intelligences.reduce(
            (sum, intel) => sum + intel.totalScore,
            0
          ),
        },
      });
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Raw response:", responseText);

      res.status(500).json({
        error: "Failed to parse AI response",
        details: "AI returned invalid JSON format",
        rawResponse: responseText.substring(0, 500), // First 500 chars for debugging
      });
    }
  } catch (error) {
    console.error("Error generating career recommendations:", error);
    res.status(500).json({
      error: "Failed to generate recommendations",
      details: error.message,
    });
  }
});
export const getAiCareerRecommendations = async ({
  careerPaths,
  top3Intelligences,
  top3Interests,
}) => {
  try {
    const systemPrompt = `
You are a friendly career counselor helping students aged 12-18 explore careers. Write in simple, encouraging language that students can easily understand. MUST return your response as a valid JSON object with the EXACT structure specified below. Do not include any markdown formatting, explanations, or text outside the JSON structure.

REQUIRED JSON STRUCTURE (you must follow this exactly):
{
  "assessmentAnalysis": {
    "currentSuggestionsAnalysis": {
      "[career_name_1]": {
        "alignment": "string - Why this career matches you (student-friendly explanation)",
        "challenges": "string - What might be tough about this job (honest but encouraging)",
        "successStrategies": "string - How you can succeed in this career (actionable advice)"
      },
      "[career_name_2]": {
        "alignment": "string - Why this career matches you (student-friendly explanation)", 
        "challenges": "string - What might be tough about this job (honest but encouraging)",
        "successStrategies": "string - How you can succeed in this career (actionable advice)"
      },
      "[career_name_3]": {
        "alignment": "string - Why this career matches you (student-friendly explanation)",
        "challenges": "string - What might be tough about this job (honest but encouraging)", 
        "successStrategies": "string - How you can succeed in this career (actionable advice)"
      }
    },
    "additionalRecommendations": [
      {
        "career": "string - Career name",
        "fitExplanation": "string - Why this job is perfect for someone like you (enthusiastic, clear explanation)",
        "challenges": "string - What you should know before choosing this path (realistic but supportive)",
        "successStrategies": "string - Steps you can take now to prepare for this career (specific, actionable advice)"
      },
      {
        "career": "string - Career name",
        "fitExplanation": "string - Why this job is perfect for someone like you (enthusiastic, clear explanation)", 
        "challenges": "string - What you should know before choosing this path (realistic but supportive)",
        "successStrategies": "string - Steps you can take now to prepare for this career (specific, actionable advice)"
      },
      {
        "career": "string - Career name",
        "fitExplanation": "string - Why this job is perfect for someone like you (enthusiastic, clear explanation)",
        "challenges": "string - What you should know before choosing this path (realistic but supportive)", 
        "successStrategies": "string - Steps you can take now to prepare for this career (specific, actionable advice)"
      },
      {
        "career": "string - Career name",
        "fitExplanation": "string - Why this job is perfect for someone like you (enthusiastic, clear explanation)",
        "challenges": "string - What you should know before choosing this path (realistic but supportive)",
        "successStrategies": "string - Steps you can take now to prepare for this career (specific, actionable advice)" 
      },
      {
        "career": "string - Career name",
        "fitExplanation": "string - Why this job is perfect for someone like you (enthusiastic, clear explanation)",
        "challenges": "string - What you should know before choosing this path (realistic but supportive)",
        "successStrategies": "string - Steps you can take now to prepare for this career (specific, actionable advice)"
      }
    ]
  }
}

WRITING STYLE REQUIREMENTS:
- Use simple, clear language (avoid jargon and complex terms)
- Be encouraging and positive while staying realistic
- Use "you" to speak directly to the student
- Include specific actions students can take NOW (join clubs, take classes, practice skills)
- Mention school subjects that connect to each career
- Keep explanations 1-2 sentences per field
- Make it exciting - help students see the cool parts of each job!

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON, no markdown code blocks
- Use the exact key names shown above
- Provide exactly 5 additional recommendations
- Replace [career_name_X] with actual lowercase career names from the input (e.g., "doctor", "bookingAgent", "newscaster")
- Ensure all strings are properly escaped for JSON
`;

    const userPrompt = `
Analyze this assessment data and provide career recommendations:

CURRENT SUGGESTED CAREERS: ${careerPaths.join(", ")}

TOP 3 INTELLIGENCES:
${top3Intelligences
  .map(
    (intel) =>
      `${intel.rank}. ${intel.intelligenceType} (Score: ${intel.totalScore}, Avg: ${intel.averageScore})`
  )
  .join("\n")}

TOP 3 INTERESTS:
${top3Interests
  .map(
    (interest) =>
      `${interest.rank}. ${interest.intelligenceType} (Score: ${interest.totalScore}, Avg: ${interest.averageScore})`
  )
  .join("\n")}
`;

    // Combine system and user prompts
    const fullPrompt = systemPrompt + "\n\n" + userPrompt;

    const result = await model.generateContent(fullPrompt);
    let responseText = result.response.text().trim();

    // More robust JSON extraction

    // Remove any markdown code blocks
    responseText = responseText.replace(/^```json\s*/, "").replace(/```$/, "");

    // Find JSON object boundaries
    const startIndex = responseText.indexOf("{");
    const lastIndex = responseText.lastIndexOf("}");

    if (startIndex !== -1 && lastIndex !== -1) {
      responseText = responseText.substring(startIndex, lastIndex + 1);
    }

    const jsonData = JSON.parse(responseText);

    // Validate the structure
    if (
      !jsonData.assessmentAnalysis ||
      !jsonData.assessmentAnalysis.currentSuggestionsAnalysis ||
      !jsonData.assessmentAnalysis.additionalRecommendations ||
      !Array.isArray(jsonData.assessmentAnalysis.additionalRecommendations) ||
      jsonData.assessmentAnalysis.additionalRecommendations.length !== 5
    ) {
      throw new Error("Invalid JSON structure returned from AI");
    }

    return {
      analysis: jsonData,
      metadata: {
        topIntelligence: top3Intelligences[0].intelligenceType,
        topInterest: top3Interests[0].intelligenceType,
        totalAssessmentScore: top3Intelligences.reduce(
          (sum, intel) => sum + intel.totalScore,
          0
        ),
      },
    };
  } catch (error) {
    console.error("Error generating career recommendations:", error);
    return;
  }
};
//app.use('/api/v1/user',userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", paymentRouter);
app.use("/api/v1/questions", questionsRouter);

// app.get("/api/get/sheet/test-stage-1", async (req, res) => {
//   try {
//     const response = await axios.get(process.env.SHEET_TEST_STAGE_1);
//     const rawData = response.data;

//     const structuredData = rawData.map((row) => ({
//       // id: row["S. No"],
//       questionId: row["S. No"],
//       question: row["Questions for Level 1 Exam (Class 6, 7, 8 & 9)"],
//       intelligenceType: row["Intelligence-Type"],
//       options: {
//         yes: parseInt(row["Yes"]),
//         maybe: parseInt(row["May Be"]),
//         no: parseInt(row["No"]),
//       },
//     }));

//     return res.status(200).json({
//       success: true,
//       message: "Questions fetched successfully",
//       data: structuredData,
//     });
//   } catch (error) {
//     console.error("Error fetching data from Google Sheet", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch questions stage 1",
//       error,
//     });
//   }
// });

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Health is ok!",
  });
});

app.listen(process.env.PORT, () => {
  console.log("Backend running on PORT:", process.env.PORT);
});
