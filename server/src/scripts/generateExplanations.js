require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const Food = require("../models/Food.js");
const connectDB = require("../config/db.js");

function extractMatches(ingredients, regex) {
  const matches = [...ingredients.toLowerCase().matchAll(regex)];
  if (!matches || matches.length === 0) return [];
  // Get unique matched words, clean them up
  const unique = [...new Set(matches.map(m => m[0].trim()))];
  return unique.slice(0, 3); // max 3 examples
}

function generateReason(nova, ingredients) {
  const ing = ingredients || "";
  
  if (nova === 1) {
    return "Classified as Tier 1 because it is an unprocessed or minimally processed whole food with no added ingredients.";
  }
  
  if (nova === 2) {
    return "Classified as Tier 2 because it is a processed culinary ingredient extracted from nature (like oil, salt, or sugar).";
  }
  
  if (nova === 3) {
    const reasons = [];
    
    const sugars = extractMatches(ing, /(?:cane sugar|sugar|syrup|honey|sweetener)/g);
    if (sugars.length > 0) reasons.push(`added sugars (${sugars.join(', ')})`);
    
    const fats = extractMatches(ing, /(?:oil|fat|butter|lard)/g);
    if (fats.length > 0) reasons.push(`added fats/oils (${fats.join(', ')})`);
    
    const salt = extractMatches(ing, /(?:salt|sodium)/g);
    if (salt.length > 0) reasons.push(`added salt (${salt.join(', ')})`);
    
    if (reasons.length > 0) {
      return `Classified as Tier 3 because culinary ingredients were added, specifically: ${reasons.join(' and ')}.`;
    }
    return "Classified as Tier 3 because culinary ingredients (like salt, sugar, or oil) were added to whole foods.";
  }
  
  if (nova === 4) {
    const reasons = [];
    
    const flavors = extractMatches(ing, /(?:flavoring|flavouring|flavor|flavour)/g);
    if (flavors.length > 0) reasons.push(`artificial flavors`);
    
    const colors = extractMatches(ing, /(?:color|dye|yellow \d+|red \d+|blue \d+|e\d{3})/g);
    if (colors.length > 0) reasons.push(`colorants`);
    
    const emulsifiers = extractMatches(ing, /(?:emulsifier|lecithin|gum|carrageenan|soya lecithins|e476)/g);
    if (emulsifiers.length > 0) reasons.push(`emulsifiers (${emulsifiers.join(', ')})`);
    
    const preservatives = extractMatches(ing, /(?:preservative|benzoate|sorbate|nitrate|nitrite|bht)/g);
    if (preservatives.length > 0) reasons.push(`preservatives (${preservatives.join(', ')})`);
    
    const sugars = extractMatches(ing, /(?:maltodextrin|dextrose|high fructose)/g);
    if (sugars.length > 0) reasons.push(`highly refined sugars (${sugars.join(', ')})`);
    
    if (reasons.length > 0) {
      return `Classified as Tier 4 because it contains industrial cosmetic additives, specifically: ${reasons.join(', ')}.`;
    }
    return "Classified as Tier 4 because it contains industrial formulations or cosmetic additives not found in home kitchens.";
  }
  
  return "";
}

async function run() {
  try {
    await connectDB();
    const foods = await Food.find({});
    let updated = 0;
    
    for (const food of foods) {
      const reason = generateReason(food.novaGroup, food.ingredientsText || "");
      food.explanationText = reason;
      await food.save();
      updated++;
    }
    
    console.log(`Successfully generated plain, analytical explanations for ${updated} cards!`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

run();
