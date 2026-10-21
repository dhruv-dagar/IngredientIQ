require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const assert = require("node:assert/strict");

const connectDB = require("../config/db");
const timeAttackRoutes = require("../routes/timeAttackRoutes");
const User = require("../models/User");
const Food = require("../models/Food");
const TimeAttackSession = require("../models/TimeAttackSession");

const JWT_SECRET = process.env.JWT_SECRET || "ingredientiq-dev-secret";

async function runTest() {
    console.log("1. Connecting to MongoDB...");
    await connectDB();

    // Set up test server
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use("/api/time-attack", timeAttackRoutes);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api/time-attack`;
    console.log(`2. Test server listening on port ${port}`);

    try {
        // Find or create test user
        let user = await User.findOne();
        if (!user) {
            user = await User.create({
                username: "test_time_attack_user",
                passwordHash: "dummyhash",
                level: 1,
                totalPoints: 50
            });
        }

        const token = jwt.sign(
            { userId: user._id.toString(), username: user.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        };

        // 3. Test POST /start
        console.log("3. Testing POST /api/time-attack/start...");
        const startRes = await fetch(`${baseUrl}/start`, {
            method: "POST",
            headers
        });
        const startData = await startRes.json();
        assert.equal(startRes.status, 201);
        assert.equal(startData.success, true);
        assert.ok(startData.sessionId);
        assert.equal(startData.durationSeconds, 60);
        assert.ok(startData.card);
        assert.ok(startData.card.name);
        assert.equal(startData.card.novaGroup, undefined, "novaGroup must be secret!");
        assert.equal(startData.card.explanationText, undefined, "explanationText must be secret!");
        console.log(`   Session created: ${startData.sessionId}`);
        console.log(`   Card 1 served: ${startData.card.name} (${startData.card._id})`);

        const sessionId = startData.sessionId;
        const firstCardId = startData.card._id;

        // 4. Test POST /answer for Card 1
        console.log("4. Testing POST /api/time-attack/answer for Card 1...");
        const answerRes1 = await fetch(`${baseUrl}/answer`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                sessionId,
                foodId: firstCardId,
                guessedLevel: 3,
                responseTimeMs: 1400
            })
        });
        const answerData1 = await answerRes1.json();
        assert.equal(answerRes1.status, 200);
        assert.equal(answerData1.success, true);
        assert.equal(answerData1.actualLevel, undefined, "actualLevel must not be revealed during run!");
        assert.equal(answerData1.isCorrect, undefined, "isCorrect must not be revealed during run!");
        assert.ok(answerData1.nextCard, "Next card must be provided");
        console.log(`   Card 2 served: ${answerData1.nextCard.name} (${answerData1.nextCard._id})`);

        const secondCardId = answerData1.nextCard._id;

        // 5. Test POST /answer for Card 2
        console.log("5. Testing POST /api/time-attack/answer for Card 2...");
        const answerRes2 = await fetch(`${baseUrl}/answer`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                sessionId,
                foodId: secondCardId,
                guessedLevel: 1,
                responseTimeMs: 950
            })
        });
        const answerData2 = await answerRes2.json();
        assert.equal(answerRes2.status, 200);
        assert.equal(answerData2.success, true);

        // 6. Test POST /finish
        console.log("6. Testing POST /api/time-attack/finish...");
        const finishRes = await fetch(`${baseUrl}/finish`, {
            method: "POST",
            headers,
            body: JSON.stringify({ sessionId })
        });
        const finishData = await finishRes.json();
        assert.equal(finishRes.status, 200);
        assert.equal(finishData.success, true);
        assert.equal(finishData.totalCards, 2);
        assert.ok(typeof finishData.correctCount === "number");
        assert.ok(typeof finishData.accuracy === "number");
        assert.ok(typeof finishData.pointsEarned === "number");
        assert.equal(finishData.cardsPlayed.length, 2);

        // Verify that cardsPlayed now has full details including novaGroup and explanation
        const recapCard1 = finishData.cardsPlayed[0];
        assert.ok(recapCard1.name);
        assert.ok(recapCard1.actualLevel >= 1 && recapCard1.actualLevel <= 4);
        assert.ok(typeof recapCard1.isCorrect === "boolean");
        console.log(`   Recap: Played ${finishData.totalCards} cards, Correct: ${finishData.correctCount}, Points change: ${finishData.pointsEarned}`);
        console.log(`   Card 1 recap: ${recapCard1.name} -> Guessed: ${recapCard1.guessedLevel}, Actual: ${recapCard1.actualLevel}`);

        // 7. Test GET /history
        console.log("7. Testing GET /api/time-attack/history...");
        const historyRes = await fetch(`${baseUrl}/history`, {
            method: "GET",
            headers
        });
        const historyData = await historyRes.json();
        assert.equal(historyRes.status, 200);
        assert.equal(historyData.success, true);
        assert.ok(Array.isArray(historyData.sessions));
        const found = historyData.sessions.find(s => s.sessionId === sessionId);
        assert.ok(found, "Completed session must appear in history");
        console.log(`   Found session in history with ${found.totalCards} cards played!`);

        // Clean up test session
        await TimeAttackSession.deleteOne({ sessionId });
        console.log("\n>>> ALL LOCAL TIME ATTACK TESTS PASSED SUCCESSFULLY! <<<");

    } finally {
        server.close();
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
});
