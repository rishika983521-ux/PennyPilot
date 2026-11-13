
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./database");
const authRoutes = require("./auth");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
// Home route
app.get("/", (req, res) => {
    res.send("Welcome to FinGrow Backend!");
});

// Test API route
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "FinGrow API is working!"
    });
});

// Database test route
app.get("/api/database-test", (req, res) => {
    try {
        const result = db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).all();

        res.json({
            success: true,
            message: "FinGrow SQLite database is connected!",
            tables: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`FinGrow server running on port ${PORT}`);
});
