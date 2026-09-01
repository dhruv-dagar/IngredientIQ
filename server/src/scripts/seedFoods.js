require("dotenv").config();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");

const connectDB = require("../config/db.js");
const Food = require("../models/Food.js");

const defaultCsvPath = path.resolve(__dirname, "../../../data/processed/game_products.csv");
const csvPath = process.env.FOOD_CSV_PATH || defaultCsvPath;

function toBoolean(value) {
  return String(value).trim().toLowerCase() === "true";
}

function normalizeRow(row) {
  // Map our CSV columns to what the Food schema expects, or adjust if Dhruv changed the schema
  // Let's assume the Food schema expects offCode, name, brand, ingredientsText, novaGroup
  return {
    offCode: String(row.code || "").trim(),
    name: String(row.display_name || "").trim(),
    brand: String(row.brands || "").trim(),
    countries: String(row.countries || "").trim(),
    categories: String(row.categories || "").trim(),
    ingredientsText: String(row.ingredients_text || "").trim(),
    novaGroup: Number(row.nova_group),
    nutriScore: String(row.nutriscore_grade || "").trim(),
    approved: toBoolean(row.game_ready) || (String(row.review_status || "").trim() === "approved")
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
      food.approved &&
      food.offCode &&
      food.name &&
      Number.isInteger(food.novaGroup) &&
      food.novaGroup >= 1 &&
      food.novaGroup <= 4
  );

  if (approved.length === 0) {
    throw new Error("No approved cards found.");
  }

  return approved;
}

async function seedFoods() {
  try {
    const foods = await readApprovedFoods();
    await connectDB();

    const operations = foods.map((food) => ({
      updateOne: {
        filter: { offCode: food.offCode },
        update: { $set: food },
        upsert: true,
      },
    }));

    const result = await Food.bulkWrite(operations);
    console.log(`Seed complete: ${foods.length} approved cards processed.`);
    console.log(`Inserted: ${result.upsertedCount}; updated: ${result.modifiedCount}; matched: ${result.matchedCount}.`);
  } finally {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
  }
}

seedFoods().catch((error) => {
  console.error("Food seed failed:", error.message);
  process.exit(1);
});
