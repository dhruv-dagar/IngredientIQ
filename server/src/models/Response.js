const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            index: true
        },

        foodId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Food",
            required: true
        },

        questionNumber: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },

        guessedLevel: {
            type: Number,
            required: true,
            min: 1,
            max: 4
        },

        actualLevel: {
            type: Number,
            required: true,
            min: 1,
            max: 4
        },

        isCorrect: {
            type: Boolean,
            required: true
        },

        responseTimeMs: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Response", responseSchema);