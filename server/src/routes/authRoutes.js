const { Router } = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "ingredientiq-dev-secret";

/*
 * REGISTER
 * POST /api/auth/register
 */
authRouter.post("/register", async (request, response, next) => {
    try {
        const { username, password } = request.body;

        // Basic validation
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

        // Check whether username already exists
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return response.status(409).json({
                message: "Username already exists."
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            username,
            passwordHash,
            totalPoints: 0,
            level: 1
        });

        return response.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: {
                id: user._id,
                username: user.username,
                totalPoints: user.totalPoints,
                level: user.level
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

        // Find user
        const user = await User.findOne({ username });

        if (!user) {
            return response.status(401).json({
                message: "Invalid username or password."
            });
        }

        // Compare password with stored hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return response.status(401).json({
                message: "Invalid username or password."
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username
            },
            JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return response.json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                username: user.username,
                totalPoints: user.totalPoints,
                level: user.level
            }
        });

    } catch (error) {
        next(error);
    }
});


module.exports = authRouter;