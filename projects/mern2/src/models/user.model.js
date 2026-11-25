const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true, required: [true, "Name is required."], maxlength: 120 },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: [true, "Email is required."],
        maxlength: 254,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
    },
    mobile: {
        type: String,
        trim: true,
        required: [true, "Mobile number is required."],
        maxlength: 24,
        match: [/^[+\d][\d\s().-]{5,22}\d$/, "Enter a valid mobile number."],
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
