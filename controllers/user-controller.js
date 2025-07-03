//import { RegModel } from "../model/userModel.js";
import { customAlphabet } from "nanoid";
import nodemailer from "nodemailer"

 const sendEmail = async (emailId,userName,registeredCode) => {
     const html = `<div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; line-height: 1.5; color: #333; background: #f9f9f9; border-radius: 10px;">
   <!-- Email Header -->
   <div style="text-align: center;">
     <img src="https://firebasestorage.googleapis.com/v0/b/cv-on-blockchain.appspot.com/o/1743838131332Logo%20with%20name.png?alt=media&token=30ed7206-368a-4c78-8c9a-8a0d029dba32" style="max-width: 120px; margin-bottom: 10px;">
   </div>
 
   <!-- Email Content -->
   <h2 style="color: #007BFF; text-align: center;">Action Required: Submit Your KYC Documents</h2>
   <p>Dear <strong>${userName}</strong>,</p>
   <p>Your olympiad registration code is - </p>
 
   <!-- Button -->
   <div style="text-align: center; margin-top: 20px;">
     <p style="display: inline-block; padding: 12px 20px; background-color: green; border-radius: 5px; color: white; text-decoration: none; font-size: 16px; font-weight: bold;">
       ${registeredCode}
     </p>
   </div>
 
 
   <!-- Support Info -->
   <p style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
     Thank you for your registration in olympiad. If you have any questions or need assistance, feel free to contact our support team at 
     <a href="mailto:investment@edubukeseal.org" style="color: #007BFF; text-decoration: none;">investment@edubukeseal.org</a>.
   </p>
 
   <!-- Signature -->
   <p>Best Wishes,</p>
   <h3 style="margin-bottom: 5px;">Team, Eduprovince Limited<br></br>(Edubuk)</h3>
 
   <!-- Footer -->
   <footer style="margin-top: 20px; font-size: 12px; color: #555; text-align: center;">
     <p>© Edubuk. All rights reserved.</p>
   </footer>
 </div>`;
 
     try {
         const transporter = nodemailer.createTransport({
             service: 'gmail',
             auth: {
                 user: "edubuk.notification@gmail.com",
                 pass:process.env.EmailPass,
             },
         });

         const info = transporter.sendMail({
             from: '"Edubuk" <edubuk.notification@gmail.com>',
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

 const generateCode = async()=>{
    let i=0;
    const PREFIX="99"
    while (i<1000) {
        const nanoId = customAlphabet('1234567890', 8)
        const newCode = PREFIX + nanoId();
        //console.log("new-code",newCode);
        const exists = await RegModel.findOne({ code: newCode });
        if (!exists) {
          return newCode;
        }
        i++;
      }
 }

  export const userRegistration = async(req,res)=>{
    const {name,college,stuClass,city,country,phoneNumber,email} = req.body;
    console.log(req.body)
    try {
        if(!name || !college || !stuClass || !city || !country || !phoneNumber || !email)
        {
            return res.status(401).json({
                success:false,
                message:"all inputs are required",
            })
        }

        const user = await RegModel.findOne({email});
        if(user)
        {
            return res.status(500).json({
                success:false,
                message:"This email id already registered",
            })
        }
        
        const newCode = await generateCode();
        //console.log("new code",newCode);
        if(newCode)
        {
        await RegModel.create({name:name,college:college,stuClasss:stuClass,city:city,country:country,phoneNumber:phoneNumber,email:email,code:newCode});
        await sendEmail(email,name,newCode)
        res.status(200).json({
            success:true,
            message:"You're successfully registered"
        })
       }
        
    } catch (error) {
        console.log("error while user registration",error);
        res.status(500).json({
            success:false,
            message:"something went wrong"
        })
    }
  }

export const getUser = async(req,res)=>{
    try {
        const {email}=req.params;
        const user = await RegModel.findOne({email});
        if(user)
        {
            return res.status(200).json({
                success:true,
                message:"user found",
                user
            })
        }
        else
        {
            return res.status(401).json({
                success:false,
                message:"user not found"
            })
        }
        
    } catch (error) {
        console.log("error while fetching user",error);
        res.status(500).json({
            success:false,
            message:"internl server error",
            error
        })
    }
}
