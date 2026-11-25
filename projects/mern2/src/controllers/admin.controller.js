const Admin = require("../models/admin.model");
const { createSecretToken } = require("../utils/secret.token");
const { authCookieOptions, clearAuthCookieOptions } = require("../utils/auth-cookie");
const bcrypt = require("bcrypt");

const publicAdmin = (admin) => ({ id: admin._id.toString(), name: admin.name, email: admin.email });

module.exports.register = async (req, res) => {
    try {
        const { name, email, phone, gender, hear_about_this, city, state, password, confirm_password } = req.body || {};
        const isValidReferral = hear_about_this && typeof hear_about_this === "object" && !Array.isArray(hear_about_this);
        if (![name, email, phone, gender, city, state, password, confirm_password].every((value) => typeof value === "string" && value.trim()) || !isValidReferral) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }
        if (password !== confirm_password) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (await Admin.exists({ email: normalizedEmail })) {
            return res.status(409).json({ success: false, message: "Could not create an account with those details." });
        }
        const admin = await Admin.create({
            name: name.trim(), email: normalizedEmail, phone: phone.trim(), gender,
            hear_about_this, city, state, password,
        });
        return res.status(201).json({ success: true, message: "Admin registered successfully.", admin: publicAdmin(admin) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "Could not create an account with those details." });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: "Check the registration details and try again." });
        }
        console.error("Admin registration failed:", error.message);
        return res.status(500).json({ success: false, message: "Unable to register right now." });
    }
};

module.exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }
        const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
        const passwordMatches = admin ? await bcrypt.compare(password, admin.password) : false;
        if (!admin || !passwordMatches) {
            return res.status(401).json({ success: false, message: "Email or password is incorrect." });
        }
        res.cookie("token", createSecretToken(admin._id), authCookieOptions);
        return res.json({ success: true, message: "Admin logged in successfully.", admin: publicAdmin(admin) });
    } catch (error) {
        console.error("Admin login failed:", error.message);
        return res.status(500).json({ success: false, message: "Unable to log in right now." });
    }
};

module.exports.logout = (req, res) => {
    res.clearCookie("token", clearAuthCookieOptions);
    return res.json({ success: true, message: "Logged out successfully." });
};
