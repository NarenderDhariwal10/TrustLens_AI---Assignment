import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("MongoDB skipped (MONGODB_URI not set)");
    return;
  }
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (e) {
    console.error("MongoDB connection failed — continuing without persistence:", e.message);
  }
}
