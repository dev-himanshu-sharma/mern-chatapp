import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - No Token Provided"
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("protectRoute: JWT_SECRET is not set");
            return res.status(500).json({
                success: false,
                message: "Server misconfiguration"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: "Database unavailable"
            });
        }

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log("Error in protectRoute middleware: ", error.message);

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Invalid or expired token"
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};