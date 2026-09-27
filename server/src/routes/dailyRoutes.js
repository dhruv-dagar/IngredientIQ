const { Router } = require("express");
const Food = require("../models/Food");
const Response = require("../models/Response");
const DailyChallenge = require("../models/DailyChallenge");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { applyScore } = require("../services/scoringService");

const dailyRouter = Router();

// All daily endpoints require a valid JWT.
dailyRouter.use(authMiddleware);

// Helper function to get today's date in YYYY-MM-DD
function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

dailyRouter.get("/today", async (request, response, next) => {
    try {
        const todayStr = getTodayString();
        
        let dailyChallenge = await DailyChallenge.findOne({ date: todayStr }).populate("foodIds", "name brand ingredientsText imageUrl source novaGroup");

        if (!dailyChallenge) {
            // Pick 5 random approved foods
            const foods = await Food.aggregate([
                { $match: { approved: true } },
                { $sample: { size: 5 } }
            ]);

            if (foods.length < 5) {
                return response.status(404).json({
                    message: "Not enough approved game cards to create a daily challenge."
                });
            }

            dailyChallenge = await DailyChallenge.create({
                date: todayStr,
                foodIds: foods.map(f => f._id)
            });

            // Populate the newly created challenge
            dailyChallenge = await DailyChallenge.findById(dailyChallenge._id).populate("foodIds", "name brand ingredientsText imageUrl source novaGroup");
        }

        const dailySessionId = `${request.user.userId}-${todayStr}`;
        const userResponses = await Response.find({
            isDaily: true,
            foodId: { $in: dailyChallenge.foodIds.map(f => f._id) },
            sessionId: dailySessionId
        });

        const responsesByFoodId = {};
        userResponses.forEach(res => {
            responsesByFoodId[res.foodId.toString()] = res;
        });

        // Hide novaGroup unless already answered
        const foods = dailyChallenge.foodIds.map((food, index) => {
            const foodObj = food.toObject ? food.toObject() : food;
            const answered = responsesByFoodId[food._id.toString()];
            
            if (!answered) {
                delete foodObj.novaGroup; // Hide answer
            }
            
            return {
                ...foodObj,
                questionNumber: index + 1,
                status: answered ? (answered.isCorrect ? "correct" : "incorrect") : "unanswered",
                guessedLevel: answered ? answered.guessedLevel : null
            };
        });

        return response.json({
            success: true,
            date: todayStr,
            foods
        });
    } catch (error) {
        next(error);
    }
});

dailyRouter.post("/answer", async (request, response, next) => {
    try {
        const { foodId, guessedLevel, responseTimeMs } = request.body;
        const todayStr = getTodayString();
        const dailySessionId = `${request.user.userId}-${todayStr}`;

        if (!foodId || !Number.isInteger(guessedLevel) || guessedLevel < 1 || guessedLevel > 4) {
            return response.status(400).json({
                message: "foodId and guessedLevel (1-4) are required."
            });
        }

        const dailyChallenge = await DailyChallenge.findOne({ date: todayStr });
        
        if (!dailyChallenge || !dailyChallenge.foodIds.some(id => id.toString() === foodId.toString())) {
            return response.status(400).json({
                message: "Food is not part of today's daily challenge."
            });
        }

        const existingResponse = await Response.findOne({
            sessionId: dailySessionId,
            foodId
        });

        if (existingResponse) {
            return response.status(409).json({
                message: "You have already answered this daily question."
            });
        }

        const food = await Food.findById(foodId);
        
        const isCorrect = Number(guessedLevel) === Number(food.novaGroup);
        const user = await User.findById(request.user.userId);

        if (!user) {
            return response.status(404).json({ message: "User not found." });
        }

        const scoring = await applyScore({
            user,
            isCorrect
        });

        const questionNumber = dailyChallenge.foodIds.findIndex(id => id.toString() === foodId.toString()) + 1;

        await Response.create({
            sessionId: dailySessionId,
            foodId: food._id,
            questionNumber,
            guessedLevel,
            actualLevel: food.novaGroup,
            isCorrect,
            isDaily: true,
            responseTimeMs: Number.isFinite(responseTimeMs) && responseTimeMs >= 0 ? responseTimeMs : 0
        });

        return response.status(201).json({
            success: true,
            isCorrect,
            actualLevel: food.novaGroup,
            ingredientsText: food.ingredientsText,
            pointsChange: scoring.pointsChange,
            totalPoints: scoring.totalPoints,
            level: scoring.level
        });

    } catch (error) {
        next(error);
    }
});

module.exports = dailyRouter;
