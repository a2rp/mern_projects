const router = require("express").Router();
const { register, login, logout } = require("../controllers/user.controller");
const { userVerification, sendVerifiedUser } = require("../middlewares/auth.middleware");
const requireJson = require("../middlewares/requireJson");

router.post("/register", requireJson, register);
router.post("/login", requireJson, login);
router.post("/logout", logout);
router.post("/", userVerification, sendVerifiedUser);

module.exports = router;
