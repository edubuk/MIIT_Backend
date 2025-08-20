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
import puppeteer from "puppeteer";
const app = express();

configDotenv();
const mongoURI = process.env.MONGO_URI;
dbConnection(mongoURI);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  // model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 4096, // Increased to handle full response
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
app.use(express.json({ limit: "50mb" }));
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
    throw new Error("Error generating career recommendations using AI");
  }
};
//app.use('/api/v1/user',userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", paymentRouter);
app.use("/api/v1/questions", questionsRouter);

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Health is ok!",
  });
});

// Helper function to wait for network idle with timeout
const waitForNetworkIdle = async (page, timeout = 30000) => {
  return Promise.race([
    page.waitForLoadState("networkidle"),
    new Promise((resolve) => setTimeout(resolve, timeout)),
  ]);
};
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post("/api/generate-pdf", async (req, res) => {
  let browser = null;
  let page = null;

  try {
    const { url, html, filename = "document.pdf" } = req.body;

    console.log("Starting PDF generation...");
    console.log("HTML length:", html ? html.length : 0, "characters");

    // Launch browser with minimal args for stability
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--allow-running-insecure-content",
        "--disable-features=VizDisplayCompositor",
        "--max_old_space_size=4096", // Increase memory limit
      ],
    });

    page = await browser.newPage();

    // Increase timeouts significantly
    await page.setDefaultTimeout(120000); // 2 minutes
    await page.setDefaultNavigationTimeout(120000); // 2 minutes

    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
    });

    // Load content
    if (url) {
      console.log("Loading URL:", url);
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });
    } else if (html) {
      console.log("Setting HTML content...");
      console.log("HTML preview:", html.substring(0, 200) + "...");

      // Try to set content with increased timeout
      try {
        await page.setContent(html, {
          waitUntil: "domcontentloaded", // Change to domcontentloaded instead of networkidle2
          timeout: 120000, // 2 minutes timeout
        });
        console.log("HTML content set successfully");
      } catch (contentError) {
        console.error("Failed to set HTML content:", contentError.message);
        throw new Error(`Failed to load HTML content: ${contentError.message}`);
      }
    } else {
      throw new Error("Either url or html must be provided");
    }

    // Wait for images with longer timeout and better error handling
    console.log("Waiting for images to load...");
    try {
      await page.waitForFunction(
        () => {
          const images = document.querySelectorAll("img");
          console.log("Images found:", images.length);
          const loadedImages = Array.from(images).filter(
            (img) => img.complete && img.naturalWidth > 0
          );
          console.log("Loaded images:", loadedImages.length);
          return loadedImages.length === images.length || images.length === 0;
        },
        {
          timeout: 30000, // 30 seconds for images
          polling: 1000, // Check every second
        }
      );
      console.log("All images loaded successfully");
    } catch (imageError) {
      console.log("Image loading timeout, checking what's loaded...");

      // Check which images failed to load
      const imageStatus = await page.evaluate(() => {
        const images = document.querySelectorAll("img");
        return Array.from(images).map((img, index) => ({
          index,
          src: img.src.substring(0, 50) + "...", // First 50 chars
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        }));
      });

      console.log("Image status:", imageStatus);
      console.log("Proceeding with PDF generation...");
    }

    // Add print-specific CSS
    await page.addStyleTag({
      content: `
        @page {
          margin: 0.5in;
          size: A4;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          img {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid;
          }
          
          .no-pdf,
          button,
          [role="button"] {
            display: none !important;
          }
          
          .page-break {
            page-break-before: always;
          }
        }
      `,
    });

    // Longer delay for CSS and images to settle
    console.log("Waiting for content to settle...");
    await delay(6000);

    console.log("Generating PDF...");

    // Generate PDF with specific options
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
    });

    console.log("PDF generated successfully, size:", pdf.length, "bytes");

    // Validate PDF buffer
    if (!pdf || pdf.length === 0) {
      throw new Error("Generated PDF is empty");
    }

    // Close browser before sending response
    await browser.close();
    browser = null;

    // Set proper headers for PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdf.length);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Send the PDF buffer directly
    res.end(pdf);
  } catch (error) {
    console.error("PDF generation error:", error);
    console.error("Error stack:", error.stack);

    // Clean up browser
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Browser close error:", closeError);
      }
    }

    // Send error response only if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        error: "PDF generation failed",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
});

app.listen(process.env.PORT, () => {
  console.log("Backend running on PORT:", process.env.PORT);
});
