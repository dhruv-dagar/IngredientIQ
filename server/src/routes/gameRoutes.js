const { randomUUID } = require("node:crypto");
const { Router } = require("express");

const Food = require("../models/Food");
const Response = require("../models/Response");
const Session = require("../models/Session");

const gameRouter = Router();

gameRouter.post("/sessions", async (_request, response, next) => {
  try {
    const sessionId = randomUUID();

    const session = await Session.create({
      sessionId,
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
    const previousFoodIds = sessionId
      ? (await Response.find({ sessionId }).select("foodId -_id").lean()).map((item) => item.foodId)
      : [];

    const match = {
      approved: true, // using new schema field
      _id: { $nin: previousFoodIds },
    };

    let [food] = await Food.aggregate([
      { $match: match },
      { $sample: { size: 1 } },
      {
        $project: {
          name: 1, // using new schema field
          brand: 1,
          ingredientsText: 1, // Fix: provide ingredients to the user
          imageUrl: 1,
          source: 1
        },
      },
    ]);

    if (!food) {
      return response.status(404).json({ message: "No approved game cards are available yet." });
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

    // Basic validation
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

    // Make sure the session exists
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return response.status(404).json({
        message: "Game session not found."
      });
    }

    // Count questions already answered
    const previousResponses = await Response.countDocuments({
      sessionId
    });

    // Game is already complete
    if (previousResponses >= session.questionCount) {
      return response.status(400).json({
        message: "Game session is complete."
      });
    }

    // Make sure this food exists and is approved
    const food = await Food.findOne({
      _id: foodId,
      approved: true
    });

    if (!food) {
      return response.status(404).json({
        message: "Game card not found."
      });
    }

    // Prevent answering the same food twice
    const existingResponse = await Response.findOne({
      sessionId,
      foodId
    });

    if (existingResponse) {
      return response.status(409).json({
        message: "This food has already been answered in this session."
      });
    }

    // Server determines the question number
    const questionNumber = previousResponses + 1;

    const isCorrect =
      Number(guessedLevel) === Number(food.novaGroup);

    // Save response
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
