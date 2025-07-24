import express from "express";
import { getQuestionsStage1 } from "../controllers/questions.controller.js";
import { getQuestionsStage2 } from "../controllers/questions.controller.js";
import { getQuestionsStage3 } from "../controllers/questions.controller.js";

const router = express.Router();

router.get("/test-stage-1", getQuestionsStage1);
router.get("/test-stage-2", getQuestionsStage2);
router.get("/test-stage-3", getQuestionsStage3);

export default router;
