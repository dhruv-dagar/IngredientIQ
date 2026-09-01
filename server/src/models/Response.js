import mongoose from "mongoose";

const responseSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
    guessedLevel: { type: Number, required: true, min: 1, max: 4 },
    actualLevel: { type: Number, required: true, min: 1, max: 4 },
    isCorrect: { type: Boolean, required: true },
    responseTimeMs: { type: Number, min: 0, default: null },
  },
  { timestamps: true },
);

responseSchema.index({ sessionId: 1, foodId: 1 });

export const Response = mongoose.model("Response", responseSchema);
