const POINTS_PER_CORRECT_ANSWER = 10;
const WRONG_ANSWER_PENALTY = 2;
const PENALTY_LEVEL = 4;
const POINTS_PER_LEVEL = 200;
const MIN_TOTAL_POINTS = 0;

function calculateLevel(totalPoints) {
    return Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
}

function calculatePointsChange({ isCorrect, currentLevel }) {
    if (isCorrect) {
        return POINTS_PER_CORRECT_ANSWER;
    }

    if (currentLevel >= PENALTY_LEVEL) {
        return -WRONG_ANSWER_PENALTY;
    }

    return 0;
}

async function applyScore({ user, isCorrect }) {
    const pointsChange = calculatePointsChange({
        isCorrect,
        currentLevel: user.level
    });

    const totalPoints = Math.max(
        MIN_TOTAL_POINTS,
        user.totalPoints + pointsChange
    );

    const level = calculateLevel(totalPoints);

    user.totalPoints = totalPoints;
    user.level = level;
    await user.save();

    return {
        pointsChange,
        totalPoints,
        level
    };
}

module.exports = {
    POINTS_PER_CORRECT_ANSWER,
    WRONG_ANSWER_PENALTY,
    PENALTY_LEVEL,
    POINTS_PER_LEVEL,
    calculateLevel,
    calculatePointsChange,
    applyScore
};
