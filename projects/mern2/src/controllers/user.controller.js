const mongoose = require("mongoose");
const User = require("../models/user.model");

const normalizeUser = (body) => {
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const mobile = typeof body?.mobile === "string" ? body.mobile.trim() : "";
    if (!name || !email || !mobile || name.length > 120 || email.length > 254 || mobile.length > 24
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        || !/^[+\d][\d\s().-]{5,22}\d$/.test(mobile)) return null;
    return { name, email, mobile };
};

const handleWriteError = (res, error) => {
    if (error.code === 11000) {
        return res.status(409).json({ success: false, message: "This email is already registered to a user." });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ success: false, message: "Check the user details and try again." });
    }
    console.error("User record request failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to save user details right now." });
};

module.exports.all = async (req, res) => {
    try {
        const users = await User.find({ owner: req.admin._id })
            .select("name email mobile createdAt updatedAt")
            .sort({ updatedAt: -1 })
            .lean();
        return res.json({ success: true, users: users.map(({ _id, ...user }) => ({ ...user, id: _id.toString() })) });
    } catch (error) {
        return handleWriteError(res, error);
    }
};

module.exports.adduser = async (req, res) => {
    const details = normalizeUser(req.body);
    if (!details) return res.status(400).json({ success: false, message: "Enter a valid name, email, and mobile number." });
    try {
        const user = await User.create({ ...details, owner: req.admin._id });
        return res.status(201).json({ success: true, user: {
            id: user._id.toString(), name: user.name, email: user.email, mobile: user.mobile,
            createdAt: user.createdAt, updatedAt: user.updatedAt,
        } });
    } catch (error) {
        return handleWriteError(res, error);
    }
};

module.exports.updateUser = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid user ID." });
    }
    const details = normalizeUser(req.body);
    if (!details) return res.status(400).json({ success: false, message: "Enter a valid name, email, and mobile number." });
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, owner: req.admin._id },
            { $set: details },
            { new: true, runValidators: true, select: "name email mobile createdAt updatedAt" },
        );
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        return res.json({ success: true, user: {
            id: user._id.toString(), name: user.name, email: user.email, mobile: user.mobile,
            createdAt: user.createdAt, updatedAt: user.updatedAt,
        } });
    } catch (error) {
        return handleWriteError(res, error);
    }
};

module.exports.deleteUser = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid user ID." });
    }
    try {
        const user = await User.findOneAndDelete({ _id: req.params.id, owner: req.admin._id });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        return res.json({ success: true, message: "User deleted." });
    } catch (error) {
        return handleWriteError(res, error);
    }
};
