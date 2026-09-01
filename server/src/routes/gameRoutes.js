const { randomUUID } = require("node:crypto");
const { Router } = require("express");

const Food = require("../models/Food");
const Response = require("../models/Response");
const Session = require("../models/Session");

const gameRouter = Router();

gameRouter.post("/sessions", async (_request, response, next) => {
  try {
    const sessionId = randomUUID();
    await Session.create({ sessionId });
    response.status(201).json({ sessionId });
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

    if (!food && sessionId) {
      // Fallback if all approved foods have been seen in this session
      [food] = await Food.aggregate([
        { $match: { approved: true } },
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
    }

    if (!food) {
      return response.status(404).json({ message: "No approved game cards are available yet." });
    }

    return response.json({ food });
  } catch (error) {
    return next(error);
  }
});

gameRouter.post("/answers", async (request, response, next) => {
  try {
    const { sessionId, foodId, guessedLevel, responseTimeMs } = request.body;

    if (!sessionId || !foodId || !Number.isInteger(guessedLevel) || guessedLevel < 1 || guessedLevel > 4) {
      return response.status(400).json({ message: "sessionId, foodId, and guessedLevel (1-4) are required." });
    }

    const food = await Food.findOne({ _id: foodId, approved: true });
    if (!food) {
      return response.status(404).json({ message: "Game card not found." });
    }

    const isCorrect = guessedLevel === food.novaGroup;
    await Response.create({
      sessionId,
      foodId: food._id,
      guessedLevel,
      actualLevel: food.novaGroup,
      isCorrect,
      responseTimeMs: Number.isFinite(responseTimeMs) ? responseTimeMs : 0,
    });

    return response.json({
      isCorrect,
      actualLevel: food.novaGroup,
      ingredientsText: food.ingredientsText,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = gameRouter;
