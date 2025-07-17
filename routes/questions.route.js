import express from "express";
import { getQuestionsStage1 } from "../controllers/questions.controller.js";

const router = express.Router();

router.get("/test-stage-1", getQuestionsStage1);

export default router;
