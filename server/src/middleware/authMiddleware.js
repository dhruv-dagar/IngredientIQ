const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "ingredientiq-dev-secret";

const authMiddleware = (request, response, next) => {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return response.status(401).json({
                message: "Authentication token is required."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, JWT_SECRET);

        request.user = decoded;

        next();
    } catch (error) {
        return response.status(401).json({
            message: "Invalid or expired authentication token."
        });
    }
};

module.exports = authMiddleware;