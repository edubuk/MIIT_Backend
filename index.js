import express from "express";
import { configDotenv } from "dotenv";
import dbConnection from "./config/db-connection.js";
import cors from "cors";
//import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import paymentRouter from "./routes/userRoutes.js";
import questionsRouter from "./routes/questions.route.js";
import axios from "axios";
const app = express();

configDotenv();
const mongoURI = process.env.MONGO_URI;
dbConnection(mongoURI);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
