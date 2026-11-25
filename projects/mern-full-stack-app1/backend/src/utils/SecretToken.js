require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.createSecretToken = (id) => {
    const secret = process.env.TOKEN_KEY;
    if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
        throw new Error("TOKEN_KEY must contain at least 32 bytes.");
    }
    return jwt.sign({ id: id.toString() }, secret, {
        expiresIn: 3 * 24 * 60 * 60,
        algorithm: "HS256",
    });
};
