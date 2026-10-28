const { randomUUID } = require("node:crypto");
const { Router } = require("express");

const Food = require("../models/Food");
const TimeAttackSession = require("../models/TimeAttackSession");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const {
    calculatePointsChange,
    calculateLevel,
    MIN_TOTAL_POINTS
} = require("../services/scoringService");
const { recordDailyActivity } = require("../services/streakService");

const timeAttackRouter = Router();

// All Time Attack endpoints require authentication
timeAttackRouter.use(authMiddleware);

/**
 * POST /api/time-attack/start
 * Starts a 60-second Time Attack session and provides the first card.
 */
timeAttackRouter.post("/start", async (request, response, next) => {
    try {
        const sessionId = randomUUID();

        // Sample 1 random approved food
        const [firstCard] = await Food.aggregate([
            { $match: { approved: true } },
            { $sample: { size: 1 } },
            {
                $project: {
                    name: 1,
                    brand: 1,
                    ingredientsText: 1,
                    imageUrl: 1,
                    source: 1
                }
            }
        ]);

        if (!firstCard) {
            return response.status(404).json({
                message: "No approved food cards available for Time Attack."
            });
        }

        const session = await TimeAttackSession.create({
            sessionId,
            userId: request.user.userId,
            durationSeconds: 60,
            startedAt: new Date()
        });

        return response.status(201).json({
            success: true,
            sessionId: session.sessionId,
            durationSeconds: session.durationSeconds,
            startedAt: session.startedAt,
            questionNumber: 1,
            card: firstCard
        });
    } catch (error) {
        return next(error);
    }
});

/**
 * POST /api/time-attack/answer
 * Submits a guess for a card during Time Attack.
 * Does NOT return the answer or correctness, only provides the next card.
 */
timeAttackRouter.post("/answer", async (request, response, next) => {
    try {
        const { sessionId, foodId, guessedLevel, responseTimeMs } = request.body;

        if (
            !sessionId ||
            !foodId ||
            !Number.isInteger(guessedLevel) ||
            guessedLevel < 1 ||
            guessedLevel > 4
        ) {
            return response.status(400).json({
                message: "sessionId, foodId, and guessedLevel (1-4) are required."
            });
        }

        const session = await TimeAttackSession.findOne({
            sessionId,
            userId: request.user.userId
        });

        if (!session) {
            return response.status(404).json({
                message: "Time Attack session not found."
            });
        }

        if (session.completedAt) {
            return response.status(400).json({
                message: "Time Attack session is already completed."
            });
        }

        // Validate time limit with a 10s grace period for in-flight requests near the buzzer
        const elapsedSeconds =
            (Date.now() - new Date(session.startedAt).getTime()) / 1000;
        if (elapsedSeconds > session.durationSeconds + 10) {
            return response.status(400).json({
                message: "Time limit has expired for this session. Please finalize score.",
                isExpired: true
            });
        }

        // Prevent answering the same card twice in the same session
        const alreadyAnswered = session.cardsPlayed.some(
            (c) => c.foodId.toString() === foodId.toString()
        );
        if (alreadyAnswered) {
            return response.status(409).json({
                message: "This food card has already been answered in this session."
            });
        }

        const food = await Food.findOne({ _id: foodId, approved: true });
        if (!food) {
            return response.status(404).json({
                message: "Food card not found."
            });
        }

        const isCorrect = Number(guessedLevel) === Number(food.novaGroup);
        const questionNumber = session.cardsPlayed.length + 1;

        session.cardsPlayed.push({
            foodId: food._id,
            questionNumber,
            guessedLevel,
            actualLevel: food.novaGroup,
            isCorrect,
            responseTimeMs:
                Number.isFinite(responseTimeMs) && responseTimeMs >= 0
                    ? responseTimeMs
                    : 0,
            answeredAt: new Date()
        });

        session.totalCards = session.cardsPlayed.length;
        session.correctCount = session.cardsPlayed.filter((c) => c.isCorrect).length;
        session.accuracy = Math.round((session.correctCount / session.totalCards) * 100);
        await session.save();

        // Sample the next card, excluding all foods already played in this session
        const playedFoodIds = session.cardsPlayed.map((c) => c.foodId);
        const [nextCard] = await Food.aggregate([
            { $match: { approved: true, _id: { $nin: playedFoodIds } } },
            { $sample: { size: 1 } },
            {
                $project: {
                    name: 1,
                    brand: 1,
                    ingredientsText: 1,
                    imageUrl: 1,
                    source: 1
                }
            }
        ]);

        const user = await User.findById(request.user.userId);
        let streakInfo = null;
        if (user) {
            streakInfo = recordDailyActivity(user);
            await user.save();
        }

        return response.json({
            success: true,
            questionNumber: questionNumber + 1,
            nextCard: nextCard || null,
            dailyStreak: streakInfo ? streakInfo.dailyStreak : 0,
            maxDailyStreak: streakInfo ? streakInfo.maxDailyStreak : 0,
            activeDays: streakInfo ? streakInfo.activeDays : [],
            streakIncremented: streakInfo ? streakInfo.streakIncremented : false,
            isFirstActivityToday: streakInfo ? streakInfo.isFirstActivityToday : false
        });
    } catch (error) {
        return next(error);
    }
});

/**
 * POST /api/time-attack/finish
 * Concludes the 60s session, tallies scores, updates user points/level,
 * and reveals the full card recap with actual levels and explanations.
 */
timeAttackRouter.post("/finish", async (request, response, next) => {
    try {
        const { sessionId } = request.body;

        if (!sessionId) {
            return response.status(400).json({
                message: "sessionId is required."
            });
        }

        const session = await TimeAttackSession.findOne({
            sessionId,
            userId: request.user.userId
        }).populate(
            "cardsPlayed.foodId",
            "name brand ingredientsText imageUrl source novaGroup explanationText"
        );

        if (!session) {
            return response.status(404).json({
                message: "Time Attack session not found."
            });
        }

        const user = await User.findById(request.user.userId);
        if (!user) {
            return response.status(404).json({ message: "User not found." });
        }

        // Only calculate points once
        if (!session.completedAt) {
            session.completedAt = new Date();
            session.totalCards = session.cardsPlayed.length;
            session.correctCount = session.cardsPlayed.filter((c) => c.isCorrect).length;
            session.accuracy =
                session.totalCards > 0
                    ? Math.round((session.correctCount / session.totalCards) * 100)
                    : 0;

            const currentTotal = Number.isFinite(user.totalPoints) ? user.totalPoints : 0;
            const currentLevel = Number.isFinite(user.level) ? user.level : 1;

            let totalPointsChange = 0;
            for (const card of session.cardsPlayed) {
                const pointsChange = calculatePointsChange({
                    isCorrect: card.isCorrect,
                    currentLevel
                });
                totalPointsChange += pointsChange;
            }

            const newTotalPoints = Math.max(
                MIN_TOTAL_POINTS ?? 0,
                currentTotal + totalPointsChange
            );

            user.totalPoints = newTotalPoints;
            user.level = calculateLevel(newTotalPoints);

            // Record daily active play streak if any cards were answered
            let streakInfo = null;
            if (session.cardsPlayed.length > 0) {
                streakInfo = recordDailyActivity(user);
            }

            await user.save();

            session.pointsEarned = totalPointsChange;
            await session.save();
        }

        // Format cards played with populated food information
        const formattedCards = session.cardsPlayed.map((c) => {
            const food = c.foodId;
            return {
                questionNumber: c.questionNumber,
                foodId: food ? food._id : null,
                name: food ? food.name : "Unknown Food",
                brand: food ? food.brand : "",
                imageUrl: food ? food.imageUrl : "",
                ingredientsText: food ? food.ingredientsText : "",
                explanationText: food ? food.explanationText : "",
                guessedLevel: c.guessedLevel,
                actualLevel: c.actualLevel,
                isCorrect: c.isCorrect,
                responseTimeMs: c.responseTimeMs
            };
        });

        return response.json({
            success: true,
            sessionId: session.sessionId,
            totalCards: session.totalCards,
            correctCount: session.correctCount,
            accuracy: session.accuracy,
            pointsEarned: session.pointsEarned,
            user: {
                totalPoints: user.totalPoints,
                level: user.level,
                dailyStreak: user.dailyStreak || 0,
                maxDailyStreak: user.maxDailyStreak || 0,
                activeDays: user.activeDays || []
            },
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            cardsPlayed: formattedCards
        });
    } catch (error) {
        return next(error);
    }
});

/**
 * GET /api/time-attack/history
 * Returns the authenticated user's recent Time Attack sessions.
 */
timeAttackRouter.get("/history", async (request, response, next) => {
    try {
        const sessions = await TimeAttackSession.find({
            userId: request.user.userId,
            completedAt: { $ne: null }
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .select(
                "sessionId durationSeconds startedAt completedAt totalCards correctCount accuracy pointsEarned"
            );

        return response.json({
            success: true,
            sessions
        });
    } catch (error) {
        return next(error);
    }
});

/**
 * GET /api/time-attack/session/:sessionId
 * Retrieves detailed breakdown of a specific completed session.
 */
timeAttackRouter.get("/session/:sessionId", async (request, response, next) => {
    try {
        const { sessionId } = request.params;

        const session = await TimeAttackSession.findOne({
            sessionId,
            userId: request.user.userId
        }).populate(
            "cardsPlayed.foodId",
            "name brand ingredientsText imageUrl source novaGroup explanationText"
        );

        if (!session) {
            return response.status(404).json({
                message: "Time Attack session not found."
            });
        }

        const formattedCards = session.cardsPlayed.map((c) => {
            const food = c.foodId;
            return {
                questionNumber: c.questionNumber,
                foodId: food ? food._id : null,
                name: food ? food.name : "Unknown Food",
                brand: food ? food.brand : "",
                imageUrl: food ? food.imageUrl : "",
                ingredientsText: food ? food.ingredientsText : "",
                explanationText: food ? food.explanationText : "",
                guessedLevel: c.guessedLevel,
                actualLevel: c.actualLevel,
                isCorrect: c.isCorrect,
                responseTimeMs: c.responseTimeMs
            };
        });

        return response.json({
            success: true,
            sessionId: session.sessionId,
            totalCards: session.totalCards,
            correctCount: session.correctCount,
            accuracy: session.accuracy,
            pointsEarned: session.pointsEarned,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
            cardsPlayed: formattedCards
        });
    } catch (error) {
        return next(error);
    }
});

module.exports = timeAttackRouter;
