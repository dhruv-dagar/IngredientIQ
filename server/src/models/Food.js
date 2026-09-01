import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    sourceCode: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    brand: { type: String, default: "", trim: true },
    countries: { type: String, default: "", trim: true },
    categories: { type: String, default: "", trim: true },
    ingredientsText: { type: String, default: "", trim: true },
    novaGroup: { type: Number, required: true, min: 1, max: 4 },
    nutriScore: { type: String, default: "", trim: true },
    gameReady: { type: Boolean, default: false },
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "needs_review"],
      default: "pending",
    },
  },
  { timestamps: true },
);

foodSchema.index({ gameReady: 1, reviewStatus: 1, novaGroup: 1 });

export const Food = mongoose.model("Food", foodSchema);
