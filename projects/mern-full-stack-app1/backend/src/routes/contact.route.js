const router = require("express").Router();
const { addContact, getAllContacts, deleteContact, updateContact } = require("../controllers/contact.controller");
const { userVerification } = require("../middlewares/auth.middleware");
const requireJson = require("../middlewares/requireJson");

router.use(userVerification);
router.get("/", getAllContacts);
router.post("/", requireJson, addContact);
router.patch("/:id", requireJson, updateContact);
router.delete("/:id", deleteContact);

module.exports = router;
