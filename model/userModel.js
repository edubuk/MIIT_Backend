import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    college: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      default: 0,
    },
    studentClass: {
      type: Number,
    },
    isCollegeStudent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const registration = mongoose.model("Users", registrationSchema);
