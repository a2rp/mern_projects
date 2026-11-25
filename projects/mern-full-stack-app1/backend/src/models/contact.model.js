const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    username: { type: String, trim: true, required: true, minlength: 2, maxlength: 100 },
    email: {
        type: String, trim: true, lowercase: true, unique: true, required: true, maxlength: 254,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
    },
    mobile: { type: String, trim: true, required: true, unique: true, match: /^\+?\d{7,15}$/ },
    userId: { type: String, trim: true, required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model("Contact", contactSchema);
