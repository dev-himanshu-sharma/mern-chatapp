import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try {
        // 1. Header se token nikalna (Aapne 'token' key use ki hai)
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - No Token Provided"
            });
        }

        // 2. Token verify karna
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - Invalid Token"
            });
        }

        // 3. User ko DB se nikalna (Password exclude karke)
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 4. User data ko request object mein save karna
        req.user = user;

        // 5. Next function call karna taaki controller tak pahunch sakein
        next();

    } catch (error) {
        console.log("Error in protectRoute middleware: ", error.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};