const router = require("express").Router();

const { adduser, all, updateUser, deleteUser } = require("../controllers/user.controller");
const { requireAdmin } = require("../middlewares/auth.middleware");

router.use(requireAdmin);
router.get("/", all);
router.post("/add", adduser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
