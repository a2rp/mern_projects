const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Name is required."],
        minlength: 2,
        maxlength: 100,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        maxlength: 254,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
        required: [true, "Email is required."],
    },
    mobile: {
        type: String,
        trim: true,
        unique: true,
        match: /^\+?\d{7,15}$/,
        required: [true, "Phone number is required."],
    },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
