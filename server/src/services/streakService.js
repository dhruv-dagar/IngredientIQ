/**
 * Streak Service
 * Handles calculation and tracking of daily active play streaks.
 */

function getStreakDateStrings(refDate = new Date()) {
    const today = new Date(refDate);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const y_yyyy = yesterday.getFullYear();
    const y_mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const y_dd = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${y_yyyy}-${y_mm}-${y_dd}`;

    return { todayStr, yesterdayStr };
}

/**
 * Calculates current active streak for display.
 * If user hasn't played today or yesterday, the active streak has lapsed to 0.
 */
function calculateActiveStreak(user, refDate = new Date()) {
    if (!user || !user.lastActiveDate) {
        return 0;
    }
    const { todayStr, yesterdayStr } = getStreakDateStrings(refDate);
    if (user.lastActiveDate === todayStr || user.lastActiveDate === yesterdayStr) {
        return user.dailyStreak || 0;
    }
    return 0;
}

/**
 * Records daily question completion and updates the user's dailyStreak.
 * Mutates user.dailyStreak, user.maxDailyStreak, and user.lastActiveDate.
 */
function recordDailyActivity(user, refDate = new Date()) {
    const { todayStr, yesterdayStr } = getStreakDateStrings(refDate);
    let streakIncremented = false;

    const currentStreak = Number.isFinite(user.dailyStreak) ? user.dailyStreak : 0;
    const currentMax = Number.isFinite(user.maxDailyStreak) ? user.maxDailyStreak : 0;

    if (user.lastActiveDate === todayStr) {
        // Already played today: streak remains intact and doesn't double increment
        user.dailyStreak = currentStreak === 0 ? 1 : currentStreak;
        streakIncremented = false;
    } else if (user.lastActiveDate === yesterdayStr) {
        // Consecutive calendar day: increment streak
        user.dailyStreak = currentStreak + 1;
        user.lastActiveDate = todayStr;
        streakIncremented = true;
    } else {
        // First active day or missed 1+ days: reset streak to 1
        user.dailyStreak = 1;
        user.lastActiveDate = todayStr;
        streakIncremented = true;
    }

    user.maxDailyStreak = Math.max(currentMax, user.dailyStreak);

    return {
        dailyStreak: user.dailyStreak,
        maxDailyStreak: user.maxDailyStreak,
        lastActiveDate: user.lastActiveDate,
        streakIncremented
    };
}

module.exports = {
    getStreakDateStrings,
    calculateActiveStreak,
    recordDailyActivity
};
