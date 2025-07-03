import { registration } from "../model/userModel.js";
import bcrypt from "bcryptjs";
import JWT from 'jsonwebtoken';
import { configDotenv } from "dotenv";
import nodemailer from "nodemailer"
import { fileURLToPath } from 'url';
import path from 'path';
import { otpModal } from "../model/otpModel.js";
import crypto from "crypto";

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);
configDotenv();

export const sendOtpEmail = async (emailId,otp) => {

    const html = `    <div
  style="
    max-width: 650px;
    margin: auto;
    font-family: Arial, sans-serif;
    line-height: 1.5;
    color: #000000;
    background: #a5ddff;
  "
>
  <!-- Email Header -->
  <div style="text-align: center;">
    <img
      src="https://firebasestorage.googleapis.com/v0/b/cv-on-blockchain.appspot.com/o/1743838131332Logo%20with%20name.png?alt=media&token=30ed7206-368a-4c78-8c9a-8a0d029dba32"
      style="max-width: 120px; margin-bottom: 10px;"
      alt="Edubuk Logo"
    />
  </div>

  <img
    src="https://firebasestorage.googleapis.com/v0/b/cv-on-blockchain.appspot.com/o/1748258206896AdobeStock_1032578995.jpg?alt=media&token=dc080a82-89f4-420e-9b66-157267023e8c"
    style="max-width: 100%; display: block;"
    alt="Edubuk Banner"
  />

  <!-- Email Content -->
  <div style="padding: 20px;">
    <p
      style="
        text-align: center;
        font-size: 1.5rem;
        font-weight: bold;
        background: linear-gradient(to right, #03257e, #006666, #f14419);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      "
    >
      SECURITY CODE FOR VERIFICATION - EDUBUK
    </p>

    <p>
      Greetings from EDUBUK team! <br /><br />
      Dear <strong>${emailId}</strong>,<br /><br />
      Your security code for authentication is: <br /><br />
    </p>

    <p style="color: #03257e; font-size: 25px; font-weight: bold;">
      OTP: [${otp}]
    </p>

    <!-- Support Info -->
    <p style="margin-top: 20px; padding-top: 15px;">
      This code is valid for the next 10 minutes only.<br /><br />
      Never share this code with anyone as we never ask for OTP.
    </p>

    <p>
      If you have not requested this code, please contact us immediately at
      <strong>support@edubuk.com</strong> or call
      <strong>+91 9250411261</strong>.
    </p>
  </div>

  <!-- Signature -->
  <div
    style="
      max-width: 650px;
      color: #ffffff;
      background-color: #03257e;
      text-align: center;
      gap: 10px;
      padding: 20px 0;
      color: #ffffff;
    "
  >
    <p>Best Wishes,<br /><strong>Team Edubuk</strong></p>

    <p
      style="
        align-items: center;
        background-color: #006666;
        width: 100%;
        padding: 10px 0;
        color: #ffffff;
      "
    >
    💻 edubukeseal.org | 📧 support@edubuk.com | 📞 +91 9250411261</p>
</p>

    <!-- Footer -->
    <footer style="font-size: 12px; text-align: center;">
      <p>© 2025 EDUBUK. All rights reserved.</p>
    </footer>
  </div>
</div>`;


    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "support@edubukeseal.org",
                pass: process.env.EmailPass,
            },
        });

        // const response = await fetch(resumeFile);
        // const arrayBuffer = await response.arrayBuffer(); // Convert response to ArrayBuffer
        // const buffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer
        //const pdfPath = path.resolve(__dirname, "../utils/edubukConsent.pdf");
        const info = transporter.sendMail({
            from: '"Edubuk" <support@edubukeseal.org>',
            to: `${emailId}`,
            subject: "Email Verification",
            text: "From edubuk",
            html: html,
        });


        return { success: true, info };
    } catch (error) {
        console.log("ERROR:WHILE SENDING MAIL", error);
        return { success: false, error };
    }
};

export const sendOtp = async(req,res)=>{
    const {email}= req.body;
    try {
        if (!email) return res.status(400).json({ message: "Email is required" });
        const otp = crypto.randomInt(100000,999999).toString(); // 6-digit otp
        sendOtpEmail(email,otp);
        await otpModal.findOneAndUpdate(
            {email},
            {otp,createdAt:new Date()},
            {upsert:true,new:true}
        )
        res.status(200).json({ 
            success:true,
            message: "OTP sent successfully" });
    } catch (error) {
        console.log("error while sending otp",error);
        res.status(500).json({
            success:false,
            message:"error while sending otp"});
    }
}

export const userRegistration = async(req,res)=>{
    try {
        const {name,email,college,phoneNumber,city,country,password,otp}=req.body;
        const otpRecord = await otpModal.findOne({email})
         console.log("otp record",otpRecord);
         console.log("otp",otp);
         console.log(otpRecord.otp !== otp)
        if (!otpRecord || otpRecord.otp !== otp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        };

        await otpModal.deleteOne({ email });

        if(!name || !email || !college || !phoneNumber || !city|| !country || !password ){
            return res.status(400).json({
                "error":"Bad request",
                "message":"All input fields are required !"
            })
        }
        const user = await registration.findOne({email})
        if(user)
        {
            return res.status(400).json({
                success:false,
                message:"email id already registered"
            })
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const data = await registration.create({name:name,email:email.toLowerCase(),college:college,phoneNumber:phoneNumber,city:city,country:country,hashedPassword:hashedPassword});
        if(data)
        {
            res.status(200).json({
                success:true,
                message:"You are registered successfully !"
            })
        }
    } catch (error) {
        if(error.code===11000)
        {
        res.status(500).json({
            success:false,
            message:"Entered phone number in registration form has already used by an user",
        })
    }else{
            res.status(500).json({
                success:false,
                message:"Entered phone number in registration form has already used by an user",
            })
        };
        console.log("error while user registration",error.code);
    }
}

export const userLogin = async(req,res)=>{
    try {
        const {email,password} = req.body;
        if(!email || !password)
        {
            return res.status(400).json({
                error:"Bad request",
                message:"All input fields are required !"
            })
        }
        const user = await registration.findOne({email});
        if(!user)
        {
            return res.status(401).json({
                error:"Unauthorized user",
                message:"No user found with this email id "
            })
        }
        console.log("user",user)
        const passwordMatched = await bcrypt.compare(password,user.hashedPassword);
        if(!passwordMatched)
        {
            return res.status(200).json({
                error:"Unauthorized user",
                message:"Incorrect password !"
            })
        }

        const token = JWT.sign({_id:user._id},process.env.JWT_SECRET_KEY,{expiresIn:"7d"});
       
        res.status(200).json({
            success:true,
            message:"Loggined Successfully !",
            user:{
                name:user.name,
                email:user.email,
                stuClass:user.stuClass,
                college:user.college,
            },
            token
        })

    } catch (error) {
        res.status(500).json({
            error:error,
            message:"Error while user trying to login",
        })
    }
}

