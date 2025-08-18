import express from "express";
import {
  checkout,
  checkPaymentStatusForStudents,
  couponVerification,
  getPaymentId,
  paymentVerification,
} from "../controllers/payment-controller.js";

const router = express.Router();

router.get("/coupon-verification/:couponCode", couponVerification);
router.post("/payment-verification", paymentVerification);
router.post("/checkout", checkout);
router.get("/getPaymentStatus/:emailId", getPaymentId);

router.get("/payment-check/student", checkPaymentStatusForStudents);
export default router;
