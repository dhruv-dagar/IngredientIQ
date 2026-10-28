require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const assert = require("node:assert/strict");

const connectDB = require("../config/db");
const gameRoutes = require("../routes/gameRoutes");
const authRoutes = require("../routes/authRoutes");
const dailyRoutes = require("../routes/dailyRoutes");
const User = require("../models/User");
const Food = require("../models/Food");

const JWT_SECRET = process.env.JWT_SECRET || "ingredientiq-dev-secret";

async function runTest() {
    console.log("1. Connecting to DB for streak API test...");
    await connectDB();

    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use("/api/game", gameRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/daily", dailyRoutes);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;

    try {
        const testUsername = `streak_tester_${Date.now()}`;
        const user = await User.create({
            username: testUsername,
            passwordHash: "dummyhash",
            totalPoints: 0,
            level: 1,
            dailyStreak: 0,
            maxDailyStreak: 0,
            lastActiveDate: null
        });

        const token = jwt.sign(
            { userId: user._id.toString(), username: user.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        };

        // Check /api/auth/me before playing
        const meRes1 = await fetch(`${baseUrl}/auth/me`, { headers });
        const meData1 = await meRes1.json();
        assert.equal(meData1.user.dailyStreak, 0);

        // Start game session
        const sessionRes = await fetch(`${baseUrl}/game/sessions`, {
            method: "POST",
            headers
        });
        const sessionData = await sessionRes.json();
        assert.equal(sessionData.success, true);
        const sessionId = sessionData.sessionId;

        // Get question
        const qRes = await fetch(`${baseUrl}/game/questions?sessionId=${sessionId}`, { headers });
        const qData = await qRes.json();
        assert.equal(qData.success, true);
        const foodId = qData.food._id;

        // Answer question
        const ansRes = await fetch(`${baseUrl}/game/answers`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                sessionId,
                foodId,
                guessedLevel: 2,
                responseTimeMs: 1000
            })
        });
        const ansData = await ansRes.json();
        assert.equal(ansRes.status, 201);
        assert.equal(ansData.dailyStreak, 1, "dailyStreak should be 1 after completing question");
        assert.equal(ansData.maxDailyStreak, 1);
        assert.equal(ansData.streakIncremented, true);

        // Check /api/auth/me after playing
        const meRes2 = await fetch(`${baseUrl}/auth/me`, { headers });
        const meData2 = await meRes2.json();
        assert.equal(meData2.user.dailyStreak, 1, "dailyStreak in /me must reflect updated active streak");

        // Clean up
        await User.deleteOne({ _id: user._id });
        console.log(">>> Live Streak API integration test passed successfully! <<<");
    } finally {
        server.close();
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error("Streak API test failed:", err);
    process.exit(1);
});
