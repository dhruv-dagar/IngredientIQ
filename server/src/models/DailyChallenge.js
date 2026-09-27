const mongoose = require("mongoose");

const dailyChallengeSchema = new mongoose.Schema(
    {
        date: {
            type: String, // Format: YYYY-MM-DD
            required: true,
            unique: true,
            index: true
        },

        foodIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Food",
                required: true
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("DailyChallenge", dailyChallengeSchema);
