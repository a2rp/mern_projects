import React, { useState } from "react";
import styles from "./styles.module.scss";
import Swal from "sweetalert2";

const AddUser = ({ cancelAction, onSave }) => {
    const [person, setPerson] = useState({ username: "", mobile: "", email: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const details = {
            username: person.username.trim(),
            mobile: person.mobile.trim(),
            email: person.email.trim().toLowerCase(),
        };
        if (details.username.length < 2 || details.username.length > 100
            || !/^\+?\d{7,15}$/.test(details.mobile)
            || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
            await Swal.fire({ icon: "error", title: "Enter a valid name, email, and phone number." });
            return;
        }
        setLoading(true);
        const saved = await onSave(details);
        if (saved) setPerson({ username: "", mobile: "", email: "" });
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.heading}>Add contact</h3>
            <form onSubmit={handleSubmit}>
                <label htmlFor="contact-name">Name</label>
                <input id="contact-name" type="text" value={person.username} onChange={(event) => setPerson({ ...person, username: event.target.value })} required minLength="2" maxLength="100" />
                <label htmlFor="contact-mobile">Phone</label>
                <input id="contact-mobile" type="tel" value={person.mobile} onChange={(event) => setPerson({ ...person, mobile: event.target.value })} required />
                <label htmlFor="contact-email">Email</label>
                <input id="contact-email" type="email" value={person.email} onChange={(event) => setPerson({ ...person, email: event.target.value })} required />
                <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
                <button type="button" name="cancel" onClick={() => cancelAction(false)}>Cancel</button>
            </form>
        </div>
    );
};

export default AddUser;
