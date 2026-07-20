import User from "../models/User.js";
import UserPreferences from "../models/UserPreferences.js";
import jwt from "jsonwebtoken";

/*
Generate JWT token
*/
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "30d",
        }
    );
};

/*
Register a new user
*/
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required.",
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists.",
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
        });

        // Create default preferences
        await UserPreferences.upsert(user.id, {
            dietary_restrictions: [],
            allergies: [],
            preferred_cuisines: [],
            default_servings: 4,
            measurement_unit: "metric",
        });

        // Generate JWT
        const token = generateToken(user);

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            token,
            user,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};