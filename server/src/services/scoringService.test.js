const assert = require("node:assert/strict");
const {
    calculateLevel,
    calculatePointsChange
} = require("./scoringService");

assert.equal(calculateLevel(0), 1);
assert.equal(calculateLevel(199), 1);
assert.equal(calculateLevel(200), 2);
assert.equal(calculateLevel(399), 2);
assert.equal(calculateLevel(400), 3);
assert.equal(calculateLevel(599), 3);
assert.equal(calculateLevel(600), 4);
assert.equal(calculateLevel(800), 5);

assert.equal(
    calculatePointsChange({ isCorrect: true, currentLevel: 1 }),
    10
);
assert.equal(
    calculatePointsChange({ isCorrect: false, currentLevel: 1 }),
    0
);
assert.equal(
    calculatePointsChange({ isCorrect: false, currentLevel: 3 }),
    0
);
assert.equal(
    calculatePointsChange({ isCorrect: false, currentLevel: 4 }),
    -2
);
assert.equal(
    calculatePointsChange({ isCorrect: false, currentLevel: 5 }),
    -2
);

console.log("Week 6 scoring service tests passed.");
