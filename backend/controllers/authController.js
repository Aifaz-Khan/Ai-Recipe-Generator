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
export const register = async (req, res, next) => {
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
        next(error);
    }
};

/*
Login user
*/
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Verify email and password
        const user = await User.verifyPassword(email, password);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Generate JWT
        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        next(error);
    }
};

/*
Get authenticated user
*/
export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const preferences = await UserPreferences.findByUserId(req.user.id);

        return res.status(200).json({
            success: true,
            user,
            preferences
        });

    } catch (error) {
        next(error);
    }
};

/*
Request password reset
Placeholder: Email functionality will be implemented later.
*/
export const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        // Placeholder: check if user exists
        await User.findByEmail(email);

        // Don't reveal whether the email exists
        return res.status(200).json({
            success: true,
            message:
                "If an account with that email exists, a password reset link will be sent. (Placeholder)"
        });

    } catch (error) {
        next(error);
    }
};