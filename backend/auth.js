
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./database");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "local-development-secret-change-before-deployment";

// Register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (typeof name !== "string" || typeof email !== "string" ||
            typeof password !== "string" || name.trim().length < 2 ||
            name.trim().length > 80 || !/^\S+@\S+\.\S+$/.test(email.trim()) ||
            password.length < 10) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid name and email, and a password of at least 10 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = db.prepare(
            "SELECT id FROM users WHERE email = ?"
        ).get(normalizedEmail);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = db.prepare(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `).run(name.trim(), normalizedEmail, hashedPassword);

        res.status(201).json({
            success: true,
            message: "Account created successfully!",
            userId: result.lastInsertRowid
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || typeof password !== "string" ||
            !/^\S+@\S+\.\S+$/.test(email.trim()) || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const user = db.prepare(
            "SELECT * FROM users WHERE email = ?"
        ).get(email.trim().toLowerCase());

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({
            success: true,
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

module.exports = router;