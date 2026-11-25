require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");


const app = express();
const PORT = process.env.PORT || 1198;

if (!process.env.MONGODB_URI || !process.env.TOKEN_KEY || Buffer.byteLength(process.env.TOKEN_KEY) < 32) {
    console.error("Set MONGODB_URI and a TOKEN_KEY with at least 32 bytes in the environment.");
    process.exit(1);
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const adminRoutes = require("./src/routes/admin.routes");
const userRoutes = require("./src/routes/user.routes");

// middlewares
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error("Origin not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
    })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use((req, res, next) => {
    console.log(req.method, req.path);
    next();
});

// routes
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/user", userRoutes);
app.get("/health", (req, res) => res.json({ success: true }));
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ success: false, message: "Request body must contain valid JSON." });
    }
    if (error.message === "Origin not allowed by CORS") {
        return res.status(403).json({ success: false, message: "This origin is not allowed." });
    }
    console.error("Request failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to process this request right now." });
});

// connect to mongodb and then start server
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("MongoDB is  connected successfully");

    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });
}).catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
});
