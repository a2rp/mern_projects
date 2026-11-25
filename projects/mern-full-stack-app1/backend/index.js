require("dotenv").config();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const userRoute = require("./src/routes/user.route");
const contactRoute = require("./src/routes/contact.route");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
}));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ success: true }));
app.use("/api/v1/user", userRoute);
app.use("/api/v1/contact", contactRoute);
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found." }));
app.use((error, _req, res, _next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ success: false, message: "Request body must contain valid JSON." });
    }
    if (error.type === "entity.too.large") {
        return res.status(413).json({ success: false, message: "Request body is too large." });
    }
    if (error.message === "Origin not allowed by CORS") {
        return res.status(403).json({ success: false, message: "This origin is not allowed." });
    }
    console.error("Request failed:", error.name);
    return res.status(500).json({ success: false, message: "Unable to process this request right now." });
});

if (require.main === module) {
    const start = async () => {
        if (!process.env.MONGO_URL) throw new Error("MONGO_URL is not configured.");
        await mongoose.connect(process.env.MONGO_URL);
        const port = Number(process.env.PORT) || 1198;
        app.listen(port, () => console.log("Server listening on port " + port));
    };
    start().catch((error) => {
        console.error("Server startup failed:", error.name);
        process.exitCode = 1;
    });
}

module.exports = app;
