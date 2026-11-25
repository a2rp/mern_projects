module.exports.isValidEmail = (value) =>
    typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

module.exports.isValidPhone = (value) => typeof value === "string" && /^\+?\d{7,15}$/.test(value);

module.exports.isValidPassword = (value) =>
    typeof value === "string"
    && Buffer.byteLength(value, "utf8") <= 72
    && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,72}$/.test(value);
