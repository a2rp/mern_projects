const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Name is required."],
        minlength: 2,
        maxlength: 80,
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
    phone: {
        type: String,
        trim: true,
        unique: true,
        match: /^\+?\d{7,15}$/,
        required: [true, "Phone number is required."],
    },
    gender: {
        type: String,
        enum: ["male", "female", "others"],
        required: [true, "Gender is required."],
    },
    hear_about_this: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    city: {
        type: String,
        enum: ["mumbai", "pune", "ahmedabad"],
        required: [true, "City is required."],
    },
    state: {
        type: String,
        enum: ["gujarat", "maharashtra"],
        required: [true, "State is required."],
    },
    password: {
        type: String,
        required: [true, "Password is required."],
        select: false,
        minlength: 12,
        maxlength: 72,
        match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,72}$/,
    },
}, { timestamps: true });

adminSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model("Admin", adminSchema);
