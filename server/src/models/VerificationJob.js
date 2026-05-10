import mongoose from "mongoose";

const ClaimResultSchema = new mongoose.Schema(
  {
    claim: String,
    type: String,
    keywords: [String],
    status: {
      type: String,
      enum: ["VERIFIED", "INACCURATE", "FALSE", "INSUFFICIENT_DATA"],
    },
    confidence: Number,
    actualData: String,
    sources: [
      {
        title: String,
        url: String,
        snippet: String,
      },
    ],
    reasoning: String,
  },
  { _id: false }
);

const VerificationJobSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  textLength: Number,
  claims: [ClaimResultSchema],
  truthScore: Number,
  summary: String,
  stats: {
    total: Number,
    verified: Number,
    inaccurate: Number,
    false: Number,
    insufficient: Number,
  },
  majorIssues: [String],
});

export const VerificationJob =
  mongoose.models.VerificationJob ||
  mongoose.model("VerificationJob", VerificationJobSchema);
