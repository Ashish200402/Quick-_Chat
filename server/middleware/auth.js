import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.header("token"); // safer way

        // First check: Is the token missing?
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "No token provided" 
            });
        }

        // Now it's safe to verify
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, user not found"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log(error.message);
        return res.status(401).json({ 
            success: false, 
            message: "Invalid or expired token" 
        });
    }
};
