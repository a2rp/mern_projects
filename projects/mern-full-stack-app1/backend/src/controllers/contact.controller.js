const mongoose = require("mongoose");
const Contact = require("../models/contact.model");
const { isValidEmail, isValidPhone } = require("../utils/validation");

const invalidDetails = "Enter a valid name, email address, and phone number.";
const normalizeContact = (body) => {
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const mobile = typeof body?.mobile === "string" ? body.mobile.trim() : "";
    if (username.length < 2 || username.length > 100 || !isValidEmail(email) || !isValidPhone(mobile)) return null;
    return { username, email, mobile };
};
const ownerId = (req) => req.user._id.toString();
// Older records used the account email as their owner key.
const ownerScope = (req) => ({ userId: { $in: [ownerId(req), req.user.email] } });
const publicContact = (contact) => ({
    _id: contact._id.toString(),
    username: contact.username,
    email: contact.email,
    mobile: contact.mobile,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
});

const respondError = (res, error) => {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "A contact with these details already exists." });
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).json({ success: false, message: invalidDetails });
    }
    console.error("Contact request failed:", error.name);
    return res.status(500).json({ success: false, message: "Unable to process contacts right now." });
};

module.exports.addContact = async (req, res) => {
    const details = normalizeContact(req.body);
    if (!details) return res.status(400).json({ success: false, message: invalidDetails });
    try {
        const contact = await Contact.create({ ...details, userId: ownerId(req) });
        return res.status(201).json({ success: true, message: "Contact added successfully.", contact: publicContact(contact) });
    } catch (error) {
        return respondError(res, error);
    }
};

module.exports.getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find(ownerScope(req)).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, contacts: contacts.map(publicContact) });
    } catch (error) {
        return respondError(res, error);
    }
};

module.exports.deleteContact = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid contact ID." });
    try {
        const contact = await Contact.findOneAndDelete({ _id: id, ...ownerScope(req) });
        if (!contact) return res.status(404).json({ success: false, message: "Contact not found." });
        return res.json({ success: true, message: "Contact deleted." });
    } catch (error) {
        return respondError(res, error);
    }
};

module.exports.updateContact = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid contact ID." });
    const details = normalizeContact(req.body);
    if (!details) return res.status(400).json({ success: false, message: invalidDetails });
    try {
        const contact = await Contact.findOneAndUpdate(
            { _id: id, ...ownerScope(req) },
            { $set: { ...details, userId: ownerId(req) } },
            { new: true, runValidators: true }
        );
        if (!contact) return res.status(404).json({ success: false, message: "Contact not found." });
        return res.json({ success: true, message: "Contact updated.", contact: publicContact(contact) });
    } catch (error) {
        return respondError(res, error);
    }
};
