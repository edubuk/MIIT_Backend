import express from "express";
import { sendOtp, userLogin, userRegistration } from "../controllers/auth-controller.js";
import { requiredSignIn } from "../middlewares/auth-middleware.js";

const router = express.Router();

router.post("/send-otp",sendOtp);
router.post("/registration",userRegistration);
router.post("/login",userLogin);

// protected auth route
router.get('/user-auth', requiredSignIn,async(req,res)=>{
    res.status(200).send({ok:true});
 })




export default router;

