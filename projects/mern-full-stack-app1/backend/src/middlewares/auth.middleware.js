require("dotenv").config();

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user.model");

const unauthorized = (res) => res.status(401).json({ success: false, message: "Authentication required." });

module.exports.userVerification = async (req, res, next) => {
    if (!process.env.TOKEN_KEY || Buffer.byteLength(process.env.TOKEN_KEY, "utf8") < 32) {
        return res.status(503).json({ success: false, message: "Authentication is not configured." });
    }
    const token = req.cookies?.token;
    if (!token) return unauthorized(res);

    let payload;
    try {
        payload = jwt.verify(token, process.env.TOKEN_KEY, { algorithms: ["HS256"] });
    } catch (_) {
        return unauthorized(res);
    }
    if (typeof payload.id !== "string" || !mongoose.isValidObjectId(payload.id)) return unauthorized(res);

    try {
        const user = await User.findById(payload.id).select("_id name email phone");
        if (!user) return unauthorized(res);
        req.user = user;
        return next();
    } catch (error) {
        console.error("Session verification failed:", error.name);
        return res.status(500).json({ success: false, message: "Unable to verify the session." });
    }
};

module.exports.sendVerifiedUser = (req, res) => {
    if (!req.user) return unauthorized(res);
    return res.json({
        success: true,
        user: { id: req.user._id.toString(), username: req.user.name, email: req.user.email },
    });
};
