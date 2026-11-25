const router = require("express").Router();

const {
    register,
    login,
    logout
} = require("../controllers/admin.controller");
const { adminVerification, requireAdmin } = require("../middlewares/auth.middleware");
const requireJson = require("../middlewares/require-json");

router.post("/register", requireJson, register);
router.post("/login", requireJson, login);
router.post("/logout", requireJson, logout);
router.post("/", requireJson, requireAdmin, adminVerification);

module.exports = router;
