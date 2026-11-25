const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Name Required"],
        maxlength: 120,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: "Invalid Email"
        },
        required: [true, "Email Required"]
    },
    phone: {
        type: String,
        trim: true,
        required: [true, "Phone Number Required"],
        unique: true,
        maxlength: 24,
        match: [/^\+?\d{7,24}$/, "Enter a valid phone number."],
    },
    gender: {
        type: String,
        trim: true,
        enum: ["male", "female", "others"],
        required: [true, "Gender Required"],
    },
    hear_about_this: {
        type: Object,
        default: {},
        required: [true, "Where did you hear about this ???"],
    },
    city: {
        type: String,
        trim: true,
        enum: ["mumbai", "pune", "ahmedabad"],
        required: [true, "City Required"],
    },
    state: {
        type: String,
        trim: true,
        enum: ["gujarat", "maharashtra", "karnataka"],
        required: [true, "State Required"]
    },
    password: {
        type: String,
        required: [true, "Password Required"],
        minlength: 12,
        maxlength: 128,
        validate(value) {
            if (!value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,128}$/)) {
                throw new Error("Use 12 to 128 characters with an uppercase letter, lowercase letter, number, and symbol.");
            }
        },
    }
}, { timestamps: true });

adminSchema.pre("save", async function () {
    this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model("Admin", adminSchema);

