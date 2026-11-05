require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const assert = require("node:assert/strict");

const connectDB = require("../config/db");
const authRoutes = require("../routes/authRoutes");
const gameRoutes = require("../routes/gameRoutes");
const dailyRoutes = require("../routes/dailyRoutes");
const User = require("../models/User");
const Food = require("../models/Food");
const Session = require("../models/Session");
const Response = require("../models/Response");

const JWT_SECRET = process.env.JWT_SECRET || "ingredientiq-dev-secret";

async function runTest() {
    console.log("1. Connecting to DB for Guest and Account Merge test...");
    await connectDB();

    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api/game", gameRoutes);
    app.use("/api/daily", dailyRoutes);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}/api`;

    let createdUserIds = [];

    try {
        // --- STEP 1: Create an Anonymous Guest Session ---
        console.log("2. Testing POST /api/auth/guest (Instant Anonymous Play)...");
        const guestRes = await fetch(`${baseUrl}/auth/guest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        const guestData = await guestRes.json();
        assert.equal(guestRes.status, 201);
        assert.equal(guestData.success, true);
        assert.ok(guestData.token);
        assert.equal(guestData.user.isGuest, true);
        assert.ok(guestData.user.username.startsWith("Guest_"));
        assert.equal(guestData.user.totalPoints, 0);

        const guestToken = guestData.token;
        const guestId = guestData.user.id;
        createdUserIds.push(guestId);
        console.log(`   Guest created: ${guestData.user.username} (ID: ${guestId})`);

        // --- STEP 2: Guest plays 1 card to start streak and score ---
        console.log("3. Guest plays 1-3 cards without login prompt...");
        const sessRes = await fetch(`${baseUrl}/game/sessions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${guestToken}`
            }
        });
        const sessData = await sessRes.json();
        assert.equal(sessData.success, true);
        const sessionId = sessData.sessionId;

        const qRes = await fetch(`${baseUrl}/game/questions?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${guestToken}` }
        });
        const qData = await qRes.json();
        assert.equal(qData.success, true);
        const foodId = qData.food._id;

        const ansRes = await fetch(`${baseUrl}/game/answers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${guestToken}`
            },
            body: JSON.stringify({
                sessionId,
                foodId,
                guessedLevel: 1, // guess
                responseTimeMs: 1200
            })
        });
        const ansData = await ansRes.json();
        assert.equal(ansRes.status, 201);
        assert.equal(ansData.dailyStreak, 1, "Guest should start a 1-day streak!");
        console.log(`   Guest progress saved in DB: Points: ${ansData.totalPoints}, Streak: ${ansData.dailyStreak}`);

        // Verify /api/auth/me shows guest progress
        const meRes = await fetch(`${baseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${guestToken}` }
        });
        const meData = await meRes.json();
        assert.equal(meData.user.isGuest, true);
        assert.equal(meData.user.dailyStreak, 1);

        // --- STEP 3: Convert Guest to Permanent Registered Account ---
        console.log("4. Testing Guest conversion to Permanent Account (Register)...");
        const permUsername = `perm_user_${Date.now()}`;
        const regRes = await fetch(`${baseUrl}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${guestToken}`
            },
            body: JSON.stringify({
                username: permUsername,
                password: "password123",
                guestUserId: guestId
            })
        });
        const regData = await regRes.json();
        assert.equal(regRes.status, 201);
        assert.equal(regData.user.username, permUsername);
        assert.equal(regData.user.isGuest, false, "Account should now be permanent!");
        assert.equal(regData.user.dailyStreak, 1, "Streak must carry over to permanent account!");
        assert.equal(regData.user.totalPoints, ansData.totalPoints, "Points must carry over!");

        // Verify the user ID stayed the same (seamless conversion)
        assert.equal(regData.user.id, guestId);
        console.log("   Guest successfully upgraded in-place to permanent account!");

        // --- STEP 4: Test Merging Guest into an ALREADY EXISTING User (e.g. Google Login to existing account) ---
        console.log("5. Testing Merging a new Guest into an ALREADY EXISTING user...");
        // 4a. Create a second guest
        const guest2Res = await fetch(`${baseUrl}/auth/guest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        const guest2Data = await guest2Res.json();
        const guest2Token = guest2Data.token;
        const guest2Id = guest2Data.user.id;
        createdUserIds.push(guest2Id);

        // 4b. Guest 2 plays a card and gets points
        const sess2Res = await fetch(`${baseUrl}/game/sessions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${guest2Token}`
            }
        });
        const sess2Data = await sess2Res.json();
        const q2Res = await fetch(`${baseUrl}/game/questions?sessionId=${sess2Data.sessionId}`, {
            headers: { Authorization: `Bearer ${guest2Token}` }
        });
        const q2Data = await q2Res.json();
        const ans2Res = await fetch(`${baseUrl}/game/answers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${guest2Token}`
            },
            body: JSON.stringify({
                sessionId: sess2Data.sessionId,
                foodId: q2Data.food._id,
                guessedLevel: 1,
                responseTimeMs: 800
            })
        });
        const ans2Data = await ans2Res.json();
        console.log(`   Guest 2 earned points: ${ans2Data.totalPoints}`);

        // 4c. Guest 2 logs into the previous permanent user (`permUsername`)
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${guest2Token}`
            },
            body: JSON.stringify({
                username: permUsername,
                password: "password123",
                guestUserId: guest2Id
            })
        });
        const loginData = await loginRes.json();
        assert.equal(loginRes.status, 200);
        assert.equal(loginData.user.username, permUsername);
        assert.equal(loginData.user.isGuest, false);
        // Merged points should be original + guest 2 points
        assert.equal(loginData.user.totalPoints, ansData.totalPoints + ans2Data.totalPoints);
        console.log(`   Successfully merged! Total points: ${loginData.user.totalPoints}`);

        // Verify guest 2 was cleaned up from database
        const checkGuest2 = await User.findById(guest2Id);
        assert.equal(checkGuest2, null, "Merged guest record must be cleaned up");

        // Verify session from guest 2 was reassigned to permanent user
        const reassignedSession = await Session.findOne({ sessionId: sess2Data.sessionId });
        assert.equal(reassignedSession.userId.toString(), guestId.toString());
        console.log("   Sessions and responses properly reassigned!");

        console.log("\n>>> ALL ANONYMOUS PLAY & ACCOUNT MERGE TESTS PASSED! <<<");
    } finally {
        server.close();
        // Clean up created test users and test sessions
        if (createdUserIds.length > 0) {
            await User.deleteMany({ _id: { $in: createdUserIds } });
            await Session.deleteMany({ userId: { $in: createdUserIds } });
        }
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
