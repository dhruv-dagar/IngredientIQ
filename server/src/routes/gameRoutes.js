const { randomUUID } = require("node:crypto");
const { Router } = require("express");

const Food = require("../models/Food");
const Response = require("../models/Response");
const Session = require("../models/Session");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const gameRouter = Router();

// All game endpoints require a valid JWT.
gameRouter.use(authMiddleware);

gameRouter.post("/sessions", async (request, response, next) => {
  try {
    const sessionId = randomUUID();

    const session = await Session.create({
      sessionId,
      userId: request.user.userId,
      questionCount: 10
    });

    response.status(201).json({
      success: true,
      sessionId: session.sessionId,
      questionCount: session.questionCount,
      startedAt: session.startedAt
    });
  } catch (error) {
    next(error);
  }
});

gameRouter.get("/questions", async (request, response, next) => {
  try {
    const { sessionId } = request.query;

    if (!sessionId) {
      return response.status(400).json({
        message: "sessionId is required."
      });
    }

    const session = await Session.findOne({
      sessionId,
      userId: request.user.userId
    });

    if (!session) {
      return response.status(404).json({
        message: "Game session not found."
      });
    }

    const previousFoodIds = (
      await Response.find({ sessionId }).select("foodId -_id").lean()
    ).map((item) => item.foodId);

    const match = {
      approved: true,
      _id: { $nin: previousFoodIds },
    };

    const [food] = await Food.aggregate([
      { $match: match },
      { $sample: { size: 1 } },
      {
        $project: {
          name: 1,
          brand: 1,
          ingredientsText: 1,
          imageUrl: 1,
          source: 1
        },
      },
    ]);

    if (!food) {
      return response.status(404).json({
        message: "No approved game cards are available yet."
      });
    }

    return response.json({
      success: true,
      questionNumber: previousFoodIds.length + 1,
      food
    });
  } catch (error) {
    return next(error);
  }
});

gameRouter.post("/answers", async (request, response, next) => {
  try {
    const {
      sessionId,
      foodId,
      guessedLevel,
      responseTimeMs
    } = request.body;

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

    // A player can only submit answers to their own session.
    const session = await Session.findOne({
      sessionId,
      userId: request.user.userId
    });

    if (!session) {
      return response.status(404).json({
        message: "Game session not found."
      });
    }

    const previousResponses = await Response.countDocuments({
      sessionId
    });

    if (previousResponses >= session.questionCount) {
      return response.status(400).json({
        message: "Game session is complete."
      });
    }

    const food = await Food.findOne({
      _id: foodId,
      approved: true
    });

    if (!food) {
      return response.status(404).json({
        message: "Game card not found."
      });
    }

    const existingResponse = await Response.findOne({
      sessionId,
      foodId
    });

    if (existingResponse) {
      return response.status(409).json({
        message: "This food has already been answered in this session."
      });
    }

    const questionNumber = previousResponses + 1;
    const isCorrect = Number(guessedLevel) === Number(food.novaGroup);

    await Response.create({
      sessionId,
      foodId: food._id,
      questionNumber,
      guessedLevel,
      actualLevel: food.novaGroup,
      isCorrect,
      responseTimeMs:
        Number.isFinite(responseTimeMs) && responseTimeMs >= 0
          ? responseTimeMs
          : 0
    });

    // Persist the player's score so it can be shown on the dashboard.
    if (isCorrect) {
      const user = await User.findByIdAndUpdate(
        request.user.userId,
        { $inc: { totalPoints: 10 } },
        { new: true }
      );

      if (!user) {
        return response.status(404).json({
          message: "User not found."
        });
      }
    }

    if (questionNumber === session.questionCount) {
      session.completedAt = new Date();
      await session.save();
    }

    return response.status(201).json({
      success: true,
      questionNumber,
      isCorrect,
      actualLevel: food.novaGroup,
      ingredientsText: food.ingredientsText
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = gameRouter;
