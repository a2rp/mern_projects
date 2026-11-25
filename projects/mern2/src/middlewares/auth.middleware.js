require("dotenv").config();

const Admin = require("../models/admin.model");
const jwt = require("jsonwebtoken");

module.exports.requireAdmin = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

    let payload;
    try {
        payload = jwt.verify(token, process.env.TOKEN_KEY, { algorithms: ["HS256"] });
    } catch {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }

    try {
        const admin = await Admin.findById(payload.id).select("_id name email");
        if (!admin) return res.status(401).json({ success: false, message: "Authentication required" });
        req.admin = admin;
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports.adminVerification = (req, res) => res.json({
    success: true,
    admin: { id: req.admin._id.toString(), name: req.admin.name, email: req.admin.email },
});

