require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const Food = require("../models/Food.js");

// Connects to the local MongoDB database
const connectDB = require("../config/db.js");

function toTitleCase(str) {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

async function cleanNames() {
  try {
    await connectDB();
    const foods = await Food.find({});
    let updated = 0;
    
    for (const food of foods) {
      const cleanName = toTitleCase(food.name);
      if (cleanName !== food.name) {
        food.name = cleanName;
        await food.save();
        updated++;
      }
    }
    console.log(`Successfully cleaned ${updated} food names to Title Case in MongoDB!`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

cleanNames();
