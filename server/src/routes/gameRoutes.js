import { randomUUID } from "node:crypto";
import { Router } from "express";

import { Food } from "../models/Food.js";
import { Response } from "../models/Response.js";
import { Session } from "../models/Session.js";

export const gameRouter = Router();

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
      gameReady: true,
      reviewStatus: "approved",
      _id: { $nin: previousFoodIds },
    };

    let [food] = await Food.aggregate([
      { $match: match },
      { $sample: { size: 1 } },
      {
        $project: {
          displayName: 1,
          brand: 1,
          categories: 1,
        },
      },
    ]);

    if (!food && sessionId) {
      [food] = await Food.aggregate([
        { $match: { gameReady: true, reviewStatus: "approved" } },
        { $sample: { size: 1 } },
        { $project: { displayName: 1, brand: 1, categories: 1 } },
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

    const food = await Food.findOne({ _id: foodId, gameReady: true, reviewStatus: "approved" });
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
      responseTimeMs: Number.isFinite(responseTimeMs) ? responseTimeMs : null,
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
