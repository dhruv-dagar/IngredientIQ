const assert = require("node:assert/strict");
const {
    getStreakDateStrings,
    calculateActiveStreak,
    recordDailyActivity
} = require("../services/streakService");

// Test 1: getStreakDateStrings
const ref1 = new Date(2026, 9, 28); // 2026-10-28
const { todayStr: t1, yesterdayStr: y1 } = getStreakDateStrings(ref1);
assert.equal(t1, "2026-10-28");
assert.equal(y1, "2026-10-27");

// Test 2: First-time play
const user = {
    dailyStreak: 0,
    maxDailyStreak: 0,
    lastActiveDate: null
};

// Day 1: 2026-10-28
const day1 = new Date(2026, 9, 28);
const r1 = recordDailyActivity(user, day1);
assert.equal(user.dailyStreak, 1);
assert.equal(user.maxDailyStreak, 1);
assert.equal(user.lastActiveDate, "2026-10-28");
assert.equal(r1.streakIncremented, true);

// Same day (Day 1) second question
const r1_again = recordDailyActivity(user, day1);
assert.equal(user.dailyStreak, 1, "Same day play should not double-increment streak");
assert.equal(user.maxDailyStreak, 1);
assert.equal(r1_again.streakIncremented, false);

// Day 2: 2026-10-29 (Consecutive Day)
const day2 = new Date(2026, 9, 29);
const r2 = recordDailyActivity(user, day2);
assert.equal(user.dailyStreak, 2, "Consecutive day play should increment streak to 2");
assert.equal(user.maxDailyStreak, 2);
assert.equal(user.lastActiveDate, "2026-10-29");
assert.equal(r2.streakIncremented, true);

// Day 3: 2026-10-30 (Consecutive Day)
const day3 = new Date(2026, 9, 30);
recordDailyActivity(user, day3);
assert.equal(user.dailyStreak, 3);
assert.equal(user.maxDailyStreak, 3);
assert.equal(user.lastActiveDate, "2026-10-30");

// Check active streak on Day 3 (after playing)
assert.equal(calculateActiveStreak(user, day3), 3);

// Check active streak on Day 4 morning (before playing, but yesterday was active)
const day4 = new Date(2026, 9, 31);
assert.equal(calculateActiveStreak(user, day4), 3, "Streak is still active on the following day before playing");

// Day 5: 2026-11-01 (User skipped Day 4 entirely)
const day5 = new Date(2026, 10, 1);
// In the morning of Day 5 before playing, streak has lapsed
assert.equal(calculateActiveStreak(user, day5), 0, "Active streak must lapse to 0 if a day was skipped");

// User plays on Day 5
const r5 = recordDailyActivity(user, day5);
assert.equal(user.dailyStreak, 1, "Streak should reset to 1 after missing a day");
assert.equal(user.maxDailyStreak, 3, "maxDailyStreak should preserve all-time best of 3");
assert.equal(user.lastActiveDate, "2026-11-01");
assert.equal(r5.streakIncremented, true);

console.log("All streak service unit tests passed successfully!");
