require("dotenv").config();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const adminRoutes = require("./src/routes/admin.routes");
const userRoutes = require("./src/routes/user.routes");

const app = express();
const PORT = Number(process.env.PORT) || 1198;
if (!process.env.MONGODB_URI || !process.env.TOKEN_KEY || Buffer.byteLength(process.env.TOKEN_KEY, "utf8") < 32) {
    throw new Error("Set MONGODB_URI and a TOKEN_KEY with at least 32 bytes in the environment.");
}

const configuredOrigins = process.env.CLIENT_ORIGIN
    || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
const allowedOrigins = configuredOrigins
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
if (!allowedOrigins.length) throw new Error("Set CLIENT_ORIGIN to the exact frontend origin(s).");

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
}));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => res.json({ success: true }));
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/user", userRoutes);
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found." }));
app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
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

const start = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    app.listen(PORT, () => console.log(`API listening on port ${PORT}.`));
};

start().catch((error) => {
    console.error("Unable to start the API:", error.name);
    process.exitCode = 1;
});

const shutdown = async () => {
    await mongoose.connection.close();
    process.exit(0);
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
