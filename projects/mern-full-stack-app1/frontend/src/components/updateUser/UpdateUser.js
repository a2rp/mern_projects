import React, { useState } from "react";
import styles from "./styles.module.scss";

const UpdateUser = ({ item, onSave, closeClick }) => {
    const [contact, setContact] = useState({
        username: item.username,
        mobile: item.mobile,
        email: item.email,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        await onSave(item._id, {
            username: contact.username.trim(),
            mobile: contact.mobile.trim(),
            email: contact.email.trim().toLowerCase(),
        });
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.heading}>Update contact</h3>
            <form onSubmit={handleSubmit}>
                <label htmlFor="edit-contact-name">Name</label>
                <input id="edit-contact-name" type="text" value={contact.username} onChange={(event) => setContact({ ...contact, username: event.target.value })} required minLength="2" maxLength="100" />
                <label htmlFor="edit-contact-mobile">Phone</label>
                <input id="edit-contact-mobile" type="tel" value={contact.mobile} onChange={(event) => setContact({ ...contact, mobile: event.target.value })} required />
                <label htmlFor="edit-contact-email">Email</label>
                <input id="edit-contact-email" type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} required />
                <button type="submit" disabled={loading}>{loading ? "Saving..." : "Update"}</button>
                <button type="button" name="cancel" onClick={closeClick}>Cancel</button>
            </form>
        </div>
    );
};

export default UpdateUser;
