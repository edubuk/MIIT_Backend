import crypto from "crypto";
import Razorpay from "razorpay";
import { config } from "dotenv";
import Payment from "../model/paymentModel.js";
import { customAlphabet } from "nanoid";
import nodemailer from "nodemailer";
config();

const keyId = process.env.RZP_KEY_ID;
const keySecret = process.env.RZP_SECRET_KEY;
if (!keyId || !keySecret) {
  throw new Error(
    "Razorpay key ID or secret is missing in environment variables"
  );
}
const instance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});
//console.log("keyId", keyId)
export const checkout = async (req, res) => {
  const { amount, curr } = req.body;
  try {
    const options = {
      amount: Number(amount),
      currency: curr,
    };

    const order = await instance.orders.create(options);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error,
    });
  }
};

const sendEmail = async (emailId, userName, registeredCode) => {
  const html = `<div style="max-width: 650px; margin: auto; font-family: Arial, sans-serif; line-height: 1.5; color: #000000; background: #A5DDFF;">
        <div style="text-align: center;">
          <img src="https://firebasestorage.googleapis.com/v0/b/cv-on-blockchain.appspot.com/o/1743838131332Logo%20with%20name.png?alt=media&token=30ed7206-368a-4c78-8c9a-8a0d029dba32" style="max-width: 120px; margin-bottom: 10px;">
        </div>
        <img src="https://firebasestorage.googleapis.com/v0/b/cv-on-blockchain.appspot.com/o/1748259904657success.png?alt=media&token=90af54a6-fc97-4ddb-bda4-38e0f6fcc487" style="max-width: 650px;">
         <div style="padding: 20px;">
          <p style="text-align: center; font-size: 1.5rem; font-weight: bold; color: #03257e;">REGISTRATION CONFIRMATION - EDUBUK</p>
          <p>Greetings from EDUBUK team! <br><br>
 
          Dear <strong>${userName}</strong>,<br><br>
 
We are pleased to inform you that your enrollment for with <strong>EDUBUK</strong> for M.I.I.T. Screening has been successfully 
completed. <br><br>
 
To complete your enrollment, please use the below confirmation code: <br><br>
 
Your Registration Code is :
  </p>
          <p style="color:#03257e; font-size:18px; font-weight: bold;">
            ${registeredCode}
          </p>
        <!-- Support Info -->
        <p style="margin-top: 20px; padding-top: 15px;">
          We appreciate your interest and look forward to supporting your engagement with our 
services. 
        </p>
        <p>Should you require any assistance, please do not hesitate to reach out to our support 
team at <strong>support@edubuk.com</strong> or call <strong>+91 9250411261</strong>. </p>
    </div>
        <!-- Signature -->
        <div style="max-width: 650px; color: #ffffff; background-color: #03257E; text-align: center; gap: 10px; padding: 10px 0;">
        <p>Best Wishes,<br><strong>Team Edubuk</strong></p>

        <p style="background-color: #006666; width:100%; color: #ffffff; padding: 10px 0;">
        💻 edubukeseal.org | 
        📧 support@edubuk.com | 
        📞 +91 9250411261
        </p>
        <!-- Footer -->
        <footer style="font-size: 12px; text-align: center;">
          <p>© 2025 EDUBUK. All rights reserved.</p>
        </footer>
    </div>
      </div>`;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "support@edubukeseal.org",
        pass: process.env.EmailPass,
      },
    });

    const info = transporter.sendMail({
      from: '"Edubuk" <support@edubukeseal.org>',
      to: `${emailId}`,
      subject: "Olympiad Registration Code",
      text: "From edubuk",
      html: html,
    });
    return { success: true, info };
  } catch (error) {
    console.log("ERROR:WHILE SENDING MAIL", error);
    return { success: false, error };
  }
};

const generateCode = async () => {
  let i = 0;
  const PREFIX = "99";
  while (i < 1000) {
    const nanoId = customAlphabet("1234567890", 8);
    const newCode = PREFIX + nanoId();
    //console.log("new-code",newCode);
    const exists = await Payment.findOne({ regCode: newCode });
    if (!exists) {
      return newCode;
    }
    i++;
  }
};

export const paymentVerification = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    emailId,
    userName,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;
  //console.log("Auth :",isAuthentic)
  if (isAuthentic) {
    const registrationCode = await generateCode();
    if (registrationCode) {
      await sendEmail(emailId, userName, registrationCode);
    }
    await Payment.create({
      emailId: emailId,
      paymentId: razorpay_payment_id,
      regCode: registrationCode,
    });
    res.status(200).json({
      success: true,
      paymentId: razorpay_payment_id,
    });
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

export const couponVerification = async (req, res) => {
  try {
    const { couponCode } = req.params;
    //console.log("couponcode ",couponCode)
    let currPrice = 499;
    switch (couponCode) {
      case "CVPRODIS":
        currPrice = 89;
        break;
      case "UPLOADITDIS":
        currPrice = 89;
        break;
      case "RESUMEDIS":
        currPrice = 89;
        break;
      case "CVCODIS":
        currPrice = 89;
        break;
      case "CVUPDIS":
        currPrice = 89;
        break;
      case "JOBSAVEDIS":
        currPrice = 89;
        break;
      case "PROCVDIS":
        currPrice = 89;
        break;
      case "UPLOADDIS":
        currPrice = 89;
        break;
      case "CARPRODIS":
        currPrice = 89;
        break;
      case "CVUPLOADDIS":
        currPrice = 89;
        break;
      case "RESUMEPRODIS":
        currPrice = 89;
        break;
      case "DISCOUNTCV":
        currPrice = 89;
        break;
      case "CAREERUPDIS":
        currPrice = 89;
        break;
      case "JOBSCVDIS":
        currPrice = 89;
        break;
      case "UPLOADCVDIS":
        currPrice = 89;
        break;
      case "RESPACKDIS":
        currPrice = 89;
        break;
      case "CAREERCVDIS":
        currPrice = 89;
        break;
      case "CVJOBDIS":
        currPrice = 89;
        break;
      default:
        res.status(200).json({
          success: false,
          value: currPrice,
        });
    }
    if (currPrice !== 499)
      res.status(200).json({
        success: true,
        value: currPrice,
      });
  } catch (error) {
    res.status(501).json({
      success: false,
      message: "error while coupon verification",
      error,
    });
  }
};

export const getPaymentId = async (req, res) => {
  const { emailId } = req.params;
  try {
    const data = await Payment.findOne({ emailId: emailId });
    if (data) {
      res.status(200).json({
        success: true,
        paymentId: data.paymentId,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "no payment record found",
      });
    }
  } catch (error) {
    console.log("error while fetching user paymentId", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
      error,
    });
  }
};
