const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const Food = require("../models/Food");

const INPUT_FILE = path.join(
    __dirname,
    "../../../data/candidates/off_candidates.json"
);

async function importFoods() {
    try {
        console.log("=================================");
        console.log(" IngredientIQ Food Importer");
        console.log("=================================");

        // -----------------------------------------
        // 1. Check MongoDB connection string
        // -----------------------------------------

        if (!process.env.MONGO_URI) {
            throw new Error(
                "MONGO_URI is not defined in the server .env file."
            );
        }

        // -----------------------------------------
        // 2. Check input file
        // -----------------------------------------

        if (!fs.existsSync(INPUT_FILE)) {
            throw new Error(
                `Input file not found:\n${INPUT_FILE}`
            );
        }

        console.log(`Reading:\n${INPUT_FILE}`);

        // -----------------------------------------
        // 3. Read candidate JSON
        // -----------------------------------------

        const rawData = fs.readFileSync(INPUT_FILE, "utf8");
        const foods = JSON.parse(rawData);

        if (!Array.isArray(foods)) {
            throw new Error(
                "Candidate JSON must contain an array of food objects."
            );
        }

        console.log(`Total candidates found: ${foods.length}`);

        // -----------------------------------------
        // 4. Keep only approved foods
        // -----------------------------------------

        const approvedFoods = foods.filter(
            food => food.approved === true
        );

        console.log(
            `Approved foods to import: ${approvedFoods.length}`
        );

        console.log(
            `Skipped unapproved foods: ${foods.length - approvedFoods.length}`
        );

        if (approvedFoods.length === 0) {
            console.log("");
            console.log(
                "No approved foods found. Nothing will be imported."
            );
            return;
        }

        // -----------------------------------------
        // 5. Connect to MongoDB
        // -----------------------------------------

        console.log("");
        console.log("Connecting to MongoDB...");

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully.");

        // -----------------------------------------
        // 6. Import using upsert
        // -----------------------------------------
        //
        // offCode is unique in Food.js.
        //
        // If the food already exists:
        //     update it
        //
        // If it doesn't exist:
        //     create it
        //
        // This makes the script safely repeatable.
        // -----------------------------------------

        let inserted = 0;
        let updated = 0;
        let failed = 0;

        for (const food of approvedFoods) {
            try {
                if (!food.offCode || !food.name || !food.novaGroup) {
                    console.log(
                        `Skipping invalid food: ${food.offCode || "unknown"}`
                    );
                    failed++;
                    continue;
                }

                const result = await Food.updateOne(
                    {
                        offCode: food.offCode
                    },
                    {
                        $set: {
                            name: food.name,
                            brand: food.brand || "",
                            ingredientsText: food.ingredientsText || "",
                            novaGroup: food.novaGroup,
                            imageUrl: food.imageUrl || "",
                            source: food.source || "Open Food Facts",
                            approved: true,
                            approvalNote: food.approvalNote || ""
                        }
                    },
                    {
                        upsert: true
                    }
                );

                if (result.upsertedCount === 1) {
                    inserted++;
                    console.log(
                        `INSERTED: ${food.name} (${food.offCode})`
                    );
                } else if (result.modifiedCount === 1) {
                    updated++;
                    console.log(
                        `UPDATED: ${food.name} (${food.offCode})`
                    );
                } else {
                    console.log(
                        `UNCHANGED: ${food.name} (${food.offCode})`
                    );
                }

            } catch (error) {
                failed++;

                console.error(
                    `FAILED: ${food.offCode || "unknown"}`
                );

                console.error(error.message);
            }
        }

        // -----------------------------------------
        // 7. Summary
        // -----------------------------------------

        console.log("");
        console.log("=================================");
        console.log(" Import complete");
        console.log("=================================");
        console.log(`Inserted : ${inserted}`);
        console.log(`Updated  : ${updated}`);
        console.log(`Failed   : ${failed}`);
        console.log("=================================");

    } catch (error) {

        console.error("");
        console.error("IMPORT FAILED");
        console.error(error.message);

        process.exitCode = 1;

    } finally {

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log("MongoDB connection closed.");
        }
    }
}

importFoods();