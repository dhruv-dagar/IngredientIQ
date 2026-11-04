const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Session = require("../models/Session");
const TimeAttackSession = require("../models/TimeAttackSession");
const Response = require("../models/Response");
const authMiddleware = require("../middleware/authMiddleware");
const { calculateActiveStreak } = require("../services/streakService");
const { calculateLevel } = require("../services/scoringService");

const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "ingredientiq-dev-secret";

/**
 * Helper to locate an active guest user from request body or bearer header.
 */
async function findGuestUser(request) {
    // 1. Check explicit body parameters
    const guestUserId = request.body.guestUserId || request.body.guestId;
    if (guestUserId) {
        try {
            const guest = await User.findById(guestUserId);
            if (guest && guest.isGuest) return guest;
        } catch (_) {}
    }

    // 2. Check guestToken in body
    const guestToken = request.body.guestToken;
    if (guestToken) {
        try {
            const decoded = jwt.verify(guestToken, JWT_SECRET);
            if (decoded && decoded.userId) {
                const guest = await User.findById(decoded.userId);
                if (guest && guest.isGuest) return guest;
            }
        } catch (_) {}
    }

    // 3. Check Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && decoded.userId) {
                const guest = await User.findById(decoded.userId);
                if (guest && guest.isGuest) return guest;
            }
        } catch (_) {}
    }

    return null;
}

/**
 * Merges a guest user's points, streaks, sessions, and responses into a permanent user.
 */
async function mergeGuestIntoUser(guestUser, permanentUser) {
    if (!guestUser || !permanentUser || guestUser._id.equals(permanentUser._id)) {
        return;
    }

    // 1. Merge points & recalculate level
    const guestPoints = Number.isFinite(guestUser.totalPoints) ? guestUser.totalPoints : 0;
    permanentUser.totalPoints = Math.max(
        0,
        (Number.isFinite(permanentUser.totalPoints) ? permanentUser.totalPoints : 0) + guestPoints
    );
    permanentUser.level = calculateLevel(permanentUser.totalPoints);

    // 2. Merge streaks and active days
    const guestActiveDays = Array.isArray(guestUser.activeDays) ? guestUser.activeDays : [];
    const permanentActiveDays = Array.isArray(permanentUser.activeDays) ? permanentUser.activeDays : [];
    permanentUser.activeDays = Array.from(new Set([...permanentActiveDays, ...guestActiveDays])).sort();

    permanentUser.maxDailyStreak = Math.max(
        permanentUser.maxDailyStreak || 0,
        guestUser.maxDailyStreak || 0,
        permanentUser.dailyStreak || 0,
        guestUser.dailyStreak || 0
    );

    if (guestUser.lastActiveDate) {
        if (!permanentUser.lastActiveDate || guestUser.lastActiveDate > permanentUser.lastActiveDate) {
            permanentUser.lastActiveDate = guestUser.lastActiveDate;
            permanentUser.dailyStreak = Math.max(permanentUser.dailyStreak || 0, guestUser.dailyStreak || 0);
        } else if (guestUser.lastActiveDate === permanentUser.lastActiveDate) {
            permanentUser.dailyStreak = Math.max(permanentUser.dailyStreak || 0, guestUser.dailyStreak || 0);
        }
    }

    // 3. Reassign standard Sessions and TimeAttackSessions
    await Session.updateMany({ userId: guestUser._id }, { userId: permanentUser._id });
    await TimeAttackSession.updateMany({ userId: guestUser._id }, { userId: permanentUser._id });

    // 4. Reassign Daily Challenge Responses (sessionId format: `${userId}-${date}`)
    const guestDailyResponses = await Response.find({
        sessionId: new RegExp(`^${guestUser._id}-`)
    });

    for (const resp of guestDailyResponses) {
        const datePart = resp.sessionId.split(`${guestUser._id}-`)[1];
        const newSessionId = `${permanentUser._id}-${datePart}`;
        const existing = await Response.findOne({
            sessionId: newSessionId,
            foodId: resp.foodId
        });
        if (!existing) {
            resp.sessionId = newSessionId;
            await resp.save();
        } else {
            await Response.deleteOne({ _id: resp._id });
        }
    }

    await permanentUser.save();
    await User.deleteOne({ _id: guestUser._id });
}

/*
 * GUEST SESSION
 * POST /api/auth/guest
 * Allows instant anonymous play without a login prompt.
 */
authRouter.post("/guest", async (request, response, next) => {
    try {
        let username;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            attempts++;
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            username = `Guest_${randomSuffix}`;
            const existing = await User.findOne({ username });
            if (!existing) {
                isUnique = true;
            }
        }

        if (!isUnique) {
            username = `Guest_${Date.now().toString().slice(-6)}`;
        }

        const user = await User.create({
            username,
            isGuest: true,
            totalPoints: 0,
            level: 1,
            dailyStreak: 0,
            maxDailyStreak: 0,
            lastActiveDate: null,
            activeDays: []
        });

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username,
                isGuest: true
            },
            JWT_SECRET,
            {
                expiresIn: "30d"
            }
        );

        return response.status(201).json({
            success: true,
            message: "Guest session initialized.",
            token,
            user: {
                id: user._id,
                username: user.username,
                isGuest: true,
                totalPoints: user.totalPoints,
                level: user.level,
                dailyStreak: 0,
                maxDailyStreak: 0,
                lastActiveDate: null,
                activeDays: []
            }
        });
    } catch (error) {
        next(error);
    }
});

/*
 * REGISTER
 * POST /api/auth/register
 */
authRouter.post("/register", async (request, response, next) => {
    try {
        const { username, password } = request.body;

        if (!username || !password) {
            return response.status(400).json({
                message: "Username and password are required."
            });
        }

        if (username.length < 3 || username.length > 30) {
            return response.status(400).json({
                message: "Username must be between 3 and 30 characters."
            });
        }

        if (password.length < 6) {
            return response.status(400).json({
                message: "Password must be at least 6 characters."
            });
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return response.status(409).json({
                message: "Username already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const guestUser = await findGuestUser(request);

        let user;
        if (guestUser && guestUser.isGuest) {
            guestUser.username = username;
            guestUser.passwordHash = passwordHash;
            guestUser.isGuest = false;
            await guestUser.save();
            user = guestUser;
        } else {
            user = await User.create({
                username,
                passwordHash,
                isGuest: false,
                totalPoints: 0,
                level: 1,
                dailyStreak: 0,
                maxDailyStreak: 0,
                lastActiveDate: null,
                activeDays: []
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username,
                isGuest: false
            },
            JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return response.status(201).json({
            success: true,
            message: "User registered successfully.",
            token,
            user: {
                id: user._id,
                username: user.username,
                isGuest: false,
                totalPoints: user.totalPoints,
                level: user.level,
                dailyStreak: user.dailyStreak || 0,
                maxDailyStreak: user.maxDailyStreak || 0,
                lastActiveDate: user.lastActiveDate || null,
                activeDays: user.activeDays || []
            }
        });
    } catch (error) {
        next(error);
    }
});

/*
 * LOGIN
 * POST /api/auth/login
 */
authRouter.post("/login", async (request, response, next) => {
    try {
        const { username, password } = request.body;

        if (!username || !password) {
            return response.status(400).json({
                message: "Username and password are required."
            });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return response.status(401).json({
                message: "Invalid username or password."
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return response.status(401).json({
                message: "Invalid username or password."
            });
        }

        // Merge any active guest progress into the user's permanent account
        const guestUser = await findGuestUser(request);
        if (guestUser && guestUser.isGuest && !guestUser._id.equals(user._id)) {
            await mergeGuestIntoUser(guestUser, user);
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username,
                isGuest: false
            },
            JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        const activeStreak = calculateActiveStreak(user);

        return response.json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                username: user.username,
                isGuest: false,
                totalPoints: user.totalPoints,
                level: user.level,
                dailyStreak: activeStreak,
                maxDailyStreak: user.maxDailyStreak || 0,
                lastActiveDate: user.lastActiveDate || null,
                activeDays: user.activeDays || []
            }
        });
    } catch (error) {
        next(error);
    }
});

/*
 * CURRENT USER
 * GET /api/auth/me
 */
authRouter.get("/me", authMiddleware, async (request, response, next) => {
    try {
        const user = await User.findById(request.user.userId)
            .select("username totalPoints level dailyStreak maxDailyStreak lastActiveDate activeDays isGuest")
            .lean();

        if (!user) {
            return response.status(404).json({
                message: "User not found."
            });
        }

        const activeStreak = calculateActiveStreak(user);

        return response.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                isGuest: !!user.isGuest,
                totalPoints: user.totalPoints,
                level: user.level,
                dailyStreak: activeStreak,
                maxDailyStreak: user.maxDailyStreak || 0,
                lastActiveDate: user.lastActiveDate || null,
                activeDays: user.activeDays || []
            }
        });
    } catch (error) {
        next(error);
    }
});

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com");

/*
 * GOOGLE LOGIN / REGISTER & GUEST MERGE
 * POST /api/auth/google
 */
authRouter.post("/google", async (request, response, next) => {
    try {
        const { token } = request.body;

        if (!token) {
            return response.status(400).json({
                message: "Google ID token is required."
            });
        }

        let ticket;
        try {
            ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
            });
        } catch (verifyError) {
            console.error("Google Auth Error:", verifyError);
            return response.status(401).json({
                message: "Invalid Google ID token.",
                error: verifyError.message
            });
        }

        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;
        
        if (!googleId) {
            return response.status(400).json({ message: "Invalid Google ID token." });
        }

        const query = [{ googleId }];
        if (email) {
            query.push({ email });
        }

        let user = await User.findOne({ $or: query });
        const guestUser = await findGuestUser(request);

        if (!user) {
            // Check if username (name) is already taken, append random if needed
            let baseName = (name || "Player").replace(/\s+/g, '').slice(0, 20);
            let username = baseName;
            const existingNameUser = await User.findOne({ username });
            if (existingNameUser) {
                username = `${baseName}${Math.floor(Math.random() * 10000)}`;
            }

            if (guestUser && guestUser.isGuest) {
                // Convert guest user in-place to permanent Google account
                guestUser.username = username;
                guestUser.email = email;
                guestUser.googleId = googleId;
                guestUser.isGuest = false;
                await guestUser.save();
                user = guestUser;
            } else {
                user = await User.create({
                    username,
                    email,
                    googleId,
                    isGuest: false,
                    totalPoints: 0,
                    level: 1,
                    dailyStreak: 0,
                    maxDailyStreak: 0,
                    lastActiveDate: null,
                    activeDays: []
                });
            }
        } else {
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }

            // Merge guest progress into existing account
            if (guestUser && guestUser.isGuest && !guestUser._id.equals(user._id)) {
                await mergeGuestIntoUser(guestUser, user);
            }
        }

        const jwtToken = jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username,
                isGuest: false
            },
            JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        const activeStreak = calculateActiveStreak(user);

        return response.json({
            success: true,
            message: "Google Login successful.",
            token: jwtToken,
            user: {
                id: user._id,
                username: user.username,
                isGuest: false,
                totalPoints: user.totalPoints,
                level: user.level,
                dailyStreak: activeStreak,
                maxDailyStreak: user.maxDailyStreak || 0,
                lastActiveDate: user.lastActiveDate || null,
                activeDays: user.activeDays || []
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = authRouter;
