require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const https = require("https");
const connectDB = require("../config/db.js");
const Food = require("../models/Food.js");

const RAW_DIR = path.resolve(__dirname, "../../../../data/raw");
const OUT_FILE = path.join(RAW_DIR, "open_food_facts_1000.json");

async function fetchPage(page) {
  const url = `https://us.openfoodfacts.org/products.json?page_size=250&page=${page}`;
  while (true) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "IngredientIQ/1.0 - Node.js Script",
          "Accept": "application/json"
        }
      });
      if (res.status === 503 || res.status === 504) {
        console.log("Rate limited... waiting 5 seconds before retry...");
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      const text = await res.text();
      if (text.startsWith("<!DOCTYPE")) {
        console.log("HTML response... waiting 5 seconds before retry...");
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      return JSON.parse(text);
    } catch (e) {
      console.error("Fetch error:", e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

function extractMatches(ingredients, regex) {
  const matches = [...(ingredients || "").toLowerCase().matchAll(regex)];
  if (!matches || matches.length === 0) return [];
  const unique = [...new Set(matches.map(m => m[0].trim()))];
  return unique.slice(0, 3);
}

function generateReason(nova, ingredients) {
  const ing = ingredients || "";
  if (nova === 1) return "Classified as Tier 1 because it is an unprocessed or minimally processed whole food with no added ingredients.";
  if (nova === 2) return "Classified as Tier 2 because it is a processed culinary ingredient extracted from nature (like oil, salt, or sugar).";
  if (nova === 3) {
    const reasons = [];
    const sugars = extractMatches(ing, /(?:cane sugar|sugar|syrup|honey|sweetener)/g);
    if (sugars.length > 0) reasons.push(`added sugars (${sugars.join(', ')})`);
    const fats = extractMatches(ing, /(?:oil|fat|butter|lard)/g);
    if (fats.length > 0) reasons.push(`added fats/oils (${fats.join(', ')})`);
    const salt = extractMatches(ing, /(?:salt|sodium)/g);
    if (salt.length > 0) reasons.push(`added salt (${salt.join(', ')})`);
    
    if (reasons.length > 0) return `Classified as Tier 3 because culinary ingredients were added, specifically: ${reasons.join(' and ')}.`;
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
    
    if (reasons.length > 0) return `Classified as Tier 4 because it contains industrial cosmetic additives, specifically: ${reasons.join(', ')}.`;
    return "Classified as Tier 4 because it contains industrial formulations or cosmetic additives not found in home kitchens.";
  }
  return "";
}

function toTitleCase(str) {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function run() {
  try {
    if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

    console.log("Starting fetch from Open Food Facts API (General English/US/UK)...");
    const validProducts = [];
    let page = 1;
    
    while (validProducts.length < 600) {
      console.log(`Fetching page ${page}... (Current valid: ${validProducts.length})`);
      const data = await fetchPage(page);
      if (!data || !data.products) break;

      for (const p of data.products) {
        if (
          p.code && 
          p.product_name && 
          p.nova_group && 
          [1,2,3,4].includes(p.nova_group) &&
          p.ingredients_text && 
          p.ingredients_text.length > 10 &&
          p.image_front_url
        ) {
          validProducts.push({
            offCode: String(p.code),
            name: toTitleCase(p.product_name),
            brand: p.brands ? toTitleCase(p.brands.split(',')[0]) : "Unknown",
            ingredientsText: p.ingredients_text,
            novaGroup: p.nova_group,
            imageUrl: p.image_front_url,
            explanationText: generateReason(p.nova_group, p.ingredients_text),
            source: "Open Food Facts",
            approved: true
          });
          if (validProducts.length >= 600) break;
        }
      }
      page++;
    }

    // 1. Save to data/raw
    fs.writeFileSync(OUT_FILE, JSON.stringify(validProducts, null, 2));
    console.log(`\nSaved ${validProducts.length} perfect products to ${OUT_FILE}`);

    // 2. Upload to MongoDB
    await connectDB();
    
    // Clear old data
    await Food.deleteMany({});
    console.log("Cleared old corrupted database items.");

    // Generate explanations and insert
    const docs = validProducts.map(p => ({
      ...p,
      explanationText: generateReason(p.novaGroup, p.ingredientsText)
    }));
    
    await Food.insertMany(docs);
    console.log(`Successfully seeded ${docs.length} brand new, pristine foods into MongoDB!`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

run();
