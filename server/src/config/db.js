import mongoose from "mongoose";

export async function connectDatabase() {
  const { MONGODB_URI, MONGODB_DB = "ingredientiq" } = process.env;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Add it to server/.env before starting the server.");
  }

  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
}
