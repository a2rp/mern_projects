const router = require("express").Router();

const {
    register,
    login,
    logout,
} = require("../controllers/admin.controller");
const { adminVerification, requireAdmin } = require("../middlewares/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify", requireAdmin, adminVerification);

module.exports = router;
