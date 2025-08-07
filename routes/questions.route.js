import express from "express";
import {
  getInterestTestQuestions,
  getQuestionsStage1,
  getQuestionsStage2,
  getQuestionsStage3,
  evaluateAnswer,
  evaluateAnswerForInterestTest,
  getFinalResult,
} from "../controllers/questions.controller.js";

const router = express.Router();

router.get("/test-stage-1", getQuestionsStage1);
router.get("/test-stage-2", getQuestionsStage2);
router.get("/test-stage-3", getQuestionsStage3);
router.post("/evaluate-answer", evaluateAnswer);
router.get("/interest-test", getInterestTestQuestions);
router.post(
  "/evaluate-answer-interest-test/:result_id",
  evaluateAnswerForInterestTest
);
router.get("/get/final-result/:result_id", getFinalResult);
export default router;
