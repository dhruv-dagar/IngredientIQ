require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const Food = require("../models/Food.js");
const connectDB = require("../config/db.js");
const https = require("https");

function fetchOFFData(barcode) {
  return new Promise((resolve, reject) => {
    https.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on("error", (e) => resolve(null));
  });
}

async function run() {
  try {
    await connectDB();
    const foods = await Food.find({ imageUrl: { $in: [null, ""] } });
    console.log(`Found ${foods.length} foods missing images.`);
    
    let updated = 0;
    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      const data = await fetchOFFData(food.offCode);
      
      if (data && data.product && data.product.image_front_url) {
        food.imageUrl = data.product.image_front_url;
        await food.save();
        updated++;
        console.log(`[${i+1}/${foods.length}] Found image for: ${food.name}`);
      } else {
        console.log(`[${i+1}/${foods.length}] No image found for: ${food.name} (${food.offCode})`);
      }
      
      // Sleep slightly to avoid spamming the API
      await new Promise(r => setTimeout(r, 200));
    }
    
    console.log(`\nDone! Successfully downloaded and saved ${updated} images to MongoDB!`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

run();
