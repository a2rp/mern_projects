import { useState } from "react";
import Swal from "sweetalert2";

const AddUser = ({ onSave, hideAddUserForm }) => {
    const [user, setUser] = useState({ name: "", mobile: "", email: "" });

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim()) || !/^\+?\d{7,15}$/.test(user.mobile.trim())) {
            await Swal.fire({ icon: "error", title: "Check the user details", text: "Enter a name, valid email address, and phone number." });
            return;
        }
        const saved = await onSave({ name: user.name.trim(), email: user.email.trim(), mobile: user.mobile.trim() });
        if (saved) setUser({ name: "", mobile: "", email: "" });
    };

    return (
        <form onSubmit={handleSubmit} style={{ padding: "15px" }}>
            <input
                style={{ display: "block", width: "100%", paddingLeft: "15px", height: "30px" }}
                type="text"
                placeholder="Name"
                autoComplete="name"
                maxLength={100}
                value={user.name}
                onChange={(event) => setUser((current) => ({ ...current, name: event.target.value }))}
                required
            />
            <input
                style={{ display: "block", width: "100%", paddingLeft: "15px", height: "30px", marginTop: "5px" }}
                type="tel"
                inputMode="tel"
                placeholder="Mobile"
                autoComplete="tel"
                maxLength={16}
                value={user.mobile}
                onChange={(event) => setUser((current) => ({ ...current, mobile: event.target.value }))}
                required
            />
            <input
                style={{ display: "block", width: "100%", paddingLeft: "15px", height: "30px", marginTop: "5px" }}
                type="email"
                placeholder="Email"
                autoComplete="email"
                maxLength={254}
                value={user.email}
                onChange={(event) => setUser((current) => ({ ...current, email: event.target.value }))}
                required
            />
            <button type="submit" style={{ display: "inline-block", width: "48%", height: "34px", marginTop: "8px", border: "none", backgroundColor: "green", color: "#fff" }}>
                Save
            </button>
            <button type="button" onClick={hideAddUserForm} style={{ float: "right", width: "48%", height: "34px", marginTop: "8px", border: "none", backgroundColor: "orangered", color: "#fff" }}>
                Cancel
            </button>
        </form>
    );
};

export default AddUser;
