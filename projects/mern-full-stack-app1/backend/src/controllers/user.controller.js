const User = require("../models/user.model");
const { createSecretToken } = require("../utils/SecretToken");
const { authCookieOptions, clearAuthCookieOptions } = require("../utils/authCookie");
const bcrypt = require("bcrypt");
const { isValidEmail, isValidPassword, isValidPhone } = require("../utils/validation");

const publicUser = (user) => ({
    id: user._id.toString(),
    username: user.name,
    email: user.email,
    phone: user.phone,
});

const invalidAccount = "Check the account details and try again.";
const stateByCity = { mumbai: "maharashtra", pune: "maharashtra", ahmedabad: "gujarat" };

module.exports.register = async (req, res) => {
    if (!process.env.TOKEN_KEY || Buffer.byteLength(process.env.TOKEN_KEY, "utf8") < 32) {
        return res.status(503).json({ success: false, message: "Authentication is not configured." });
    }
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const city = typeof body.city === "string" ? body.city : "";
    const hearAbout = {};
    for (const option of ["linkedin", "friends", "job_portal", "others"]) {
        hearAbout[option] = body.hear_about_this?.[option] === true;
    }

    if (name.length < 2 || name.length > 80 || !isValidEmail(email) || !isValidPhone(phone)
        || !["male", "female", "others"].includes(body.gender) || !stateByCity[city]
        || !isValidPassword(body.password) || body.password !== body.confirm_password) {
        return res.status(400).json({ success: false, message: invalidAccount });
    }

    try {
        if (await User.exists({ $or: [{ email }, { phone }] })) {
            return res.status(409).json({ success: false, message: "An account with these details already exists." });
        }
        const user = await User.create({
            name, email, phone, gender: body.gender, hear_about_this: hearAbout,
            city, state: stateByCity[city], password: body.password,
        });
        res.cookie("token", createSecretToken(user._id), authCookieOptions);
        return res.status(201).json({ success: true, message: "Account created successfully.", user: publicUser(user) });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ success: false, message: "An account with these details already exists." });
        if (error.name === "ValidationError") return res.status(400).json({ success: false, message: invalidAccount });
        console.error("Account registration failed:", error.name);
        return res.status(500).json({ success: false, message: "Unable to register right now." });
    }
};

module.exports.login = async (req, res) => {
    if (!process.env.TOKEN_KEY || Buffer.byteLength(process.env.TOKEN_KEY, "utf8") < 32) {
        return res.status(503).json({ success: false, message: "Authentication is not configured." });
    }
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = req.body?.password;
    if (!isValidEmail(email) || typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72) {
        return res.status(401).json({ success: false, message: "Email or password is incorrect." });
    }

    try {
        const user = await User.findOne({ email }).select("+password");
        const matches = user ? await bcrypt.compare(password, user.password) : false;
        if (!user || !matches) return res.status(401).json({ success: false, message: "Email or password is incorrect." });
        res.cookie("token", createSecretToken(user._id), authCookieOptions);
        return res.json({ success: true, message: "Logged in successfully.", user: publicUser(user) });
    } catch (error) {
        console.error("Login failed:", error.name);
        return res.status(500).json({ success: false, message: "Unable to log in right now." });
    }
};

module.exports.logout = (_req, res) => {
    res.clearCookie("token", clearAuthCookieOptions);
    return res.json({ success: true, message: "Logged out successfully." });
};
