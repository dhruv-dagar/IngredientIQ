const mongoose = require("mongoose");

const cardPlayedSchema = new mongoose.Schema(
    {
        foodId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Food",
            required: true
        },
        questionNumber: {
            type: Number,
            required: true,
            min: 1
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
            default: 0
        },
        answeredAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: true }
);

const timeAttackSessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        durationSeconds: {
            type: Number,
            default: 60
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: {
            type: Date,
            default: null
        },
        cardsPlayed: [cardPlayedSchema],
        totalCards: {
            type: Number,
            default: 0
        },
        correctCount: {
            type: Number,
            default: 0
        },
        accuracy: {
            type: Number,
            default: 0
        },
        pointsEarned: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("TimeAttackSession", timeAttackSessionSchema);
