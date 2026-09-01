import "dotenv/config";
import cors from "cors";
import express from "express";

import { connectDatabase } from "./config/db.js";
import { gameRouter } from "./routes/gameRoutes.js";

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "ingredientiq-server" });
});

app.use("/api/game", gameRouter);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Server error" });
});

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`IngredientIQ API running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
