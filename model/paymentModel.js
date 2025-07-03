import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    emailId:{
        type:String,
        required:true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    regCode:{
      type:String,
      required:true,
    }
  },{timestamps:true});


const Payment = mongoose.model('payments', transactionSchema);
export default Payment;