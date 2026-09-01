import "dotenv/config";
import mongoose from "mongoose";

import { connectDatabase } from "../config/db.js";

try {
  await connectDatabase();
  await mongoose.connection.db.admin().ping();
  console.log("MongoDB connection test passed.");
} finally {
  await mongoose.disconnect();
}
