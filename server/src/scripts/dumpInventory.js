require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const connectDB = require("../config/db.js");
const Food = require("../models/Food.js");
const fs = require("fs");

async function run() {
  await connectDB();
  const foods = await Food.find({}, "name brand novaGroup");
  let md = "# Current Database Inventory (200 Items)\n\n";
  foods.forEach((f, i) => {
    md += `${i + 1}. **${f.name}** (${f.brand}) - Tier ${f.novaGroup}\n`;
  });
  
  fs.writeFileSync("C:/Users/hanus/.gemini/antigravity/brain/1bb66295-ae16-4ebd-a544-9fbe9d9e101f/inventory.md", md);
  console.log("Done");
  mongoose.disconnect();
}
run();
