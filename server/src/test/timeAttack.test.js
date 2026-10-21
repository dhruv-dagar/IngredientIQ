const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const TimeAttackSession = require("../models/TimeAttackSession");
const {
    calculatePointsChange,
    calculateLevel
} = require("../services/scoringService");

// 1. Verify TimeAttackSession schema fields
const sessionDoc = new TimeAttackSession({
    sessionId: "test-session-123",
    userId: new mongoose.Types.ObjectId(),
    durationSeconds: 60,
    startedAt: new Date(),
    cardsPlayed: [
        {
            foodId: new mongoose.Types.ObjectId(),
            questionNumber: 1,
            guessedLevel: 2,
            actualLevel: 2,
            isCorrect: true,
            responseTimeMs: 1200
        },
        {
            foodId: new mongoose.Types.ObjectId(),
            questionNumber: 2,
            guessedLevel: 4,
            actualLevel: 1,
            isCorrect: false,
            responseTimeMs: 800
        }
    ],
    totalCards: 2,
    correctCount: 1,
    accuracy: 50,
    pointsEarned: 10
});

assert.equal(sessionDoc.sessionId, "test-session-123");
assert.equal(sessionDoc.durationSeconds, 60);
assert.equal(sessionDoc.cardsPlayed.length, 2);
assert.equal(sessionDoc.cardsPlayed[0].isCorrect, true);
assert.equal(sessionDoc.cardsPlayed[1].isCorrect, false);
assert.equal(sessionDoc.totalCards, 2);
assert.equal(sessionDoc.correctCount, 1);
assert.equal(sessionDoc.accuracy, 50);

// 2. Verify points calculation logic for rapid-fire cards
let currentLevel = 1;
let points = 0;
sessionDoc.cardsPlayed.forEach((card) => {
    points += calculatePointsChange({
        isCorrect: card.isCorrect,
        currentLevel
    });
});
assert.equal(points, 10); // 1 correct (+10), 1 wrong (0 penalty at level 1)

// 3. Verify at level 4 wrong answer has penalty
currentLevel = 4;
points = 0;
sessionDoc.cardsPlayed.forEach((card) => {
    points += calculatePointsChange({
        isCorrect: card.isCorrect,
        currentLevel
    });
});
assert.equal(points, 8); // 1 correct (+10), 1 wrong (-2 penalty at level 4)

console.log("All Time Attack backend schema and calculation tests passed!");
