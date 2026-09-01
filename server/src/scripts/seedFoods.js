import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import csv from "csv-parser";
import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";
import { Food } from "../models/Food.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const defaultCsvPath = path.resolve(currentDirectory, "../../../data/processed/game_products.csv");
const csvPath = process.env.FOOD_CSV_PATH || defaultCsvPath;

function toBoolean(value) {
  return String(value).trim().toLowerCase() === "true";
}

function normalizeRow(row) {
  return {
    sourceCode: String(row.code || "").trim(),
    displayName: String(row.display_name || "").trim(),
    brand: String(row.brands || "").trim(),
    countries: String(row.countries || "").trim(),
    categories: String(row.categories || "").trim(),
    ingredientsText: String(row.ingredients_text || "").trim(),
    novaGroup: Number(row.nova_group),
    nutriScore: String(row.nutriscore_grade || "").trim(),
    gameReady: toBoolean(row.game_ready),
    reviewStatus: String(row.review_status || "pending").trim(),
  };
}

async function readApprovedFoods() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Food CSV not found: ${csvPath}. Create data/processed/game_products.csv first.`);
  }

  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => rows.push(normalizeRow(row)))
      .on("end", resolve)
      .on("error", reject);
  });

  const approved = rows.filter(
    (food) =>
      food.gameReady &&
      food.reviewStatus === "approved" &&
      food.sourceCode &&
      food.displayName &&
      Number.isInteger(food.novaGroup) &&
      food.novaGroup >= 1 &&
      food.novaGroup <= 4,
  );

  if (approved.length === 0) {
    throw new Error("No approved cards found. Set game_ready=true and review_status=approved in game_products.csv.");
  }

  return approved;
}

async function seedFoods() {
  try {
    const foods = await readApprovedFoods();
    await connectDatabase();

    const operations = foods.map((food) => ({
      updateOne: {
        filter: { sourceCode: food.sourceCode },
        update: { $set: food },
        upsert: true,
      },
    }));

    const result = await Food.bulkWrite(operations);
    console.log(`Seed complete: ${foods.length} approved cards processed.`);
    console.log(`Inserted: ${result.upsertedCount}; updated: ${result.modifiedCount}; matched: ${result.matchedCount}.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedFoods().catch((error) => {
  console.error("Food seed failed:", error.message);
  process.exit(1);
});
