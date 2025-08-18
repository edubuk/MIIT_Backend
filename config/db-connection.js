import mongoose from "mongoose";

const dbConnection = async (mongoURI) => {
  try {
    await mongoose.connect(mongoURI, {
      dbName: "MIIT",
    });
    console.log("Connected to database !");
  } catch (error) {
    console.log("Error while connecting to database ", error);
  }
};

export default dbConnection;
