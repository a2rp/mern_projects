import { useEffect, useState } from "react";

const inputStyle = { marginTop: "15px", width: "100%", height: "36px", paddingLeft: "12px" };

const UpdateUser = ({ editableUser, editUser, hideUpdateSection }) => {
    const [user, setUser] = useState(editableUser);

    useEffect(() => setUser(editableUser), [editableUser]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        await editUser(user);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 style={{ fontSize: "20px", color: "#000", textAlign: "center" }}>Update user</h2>
            <input
                type="text"
                placeholder="Name"
                autoComplete="name"
                maxLength={100}
                value={user?.name || ""}
                onChange={(event) => setUser((current) => ({ ...current, name: event.target.value }))}
                style={inputStyle}
                required
            />
            <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                maxLength={254}
                value={user?.email || ""}
                onChange={(event) => setUser((current) => ({ ...current, email: event.target.value }))}
                style={inputStyle}
                required
            />
            <input
                type="tel"
                inputMode="tel"
                placeholder="Mobile"
                autoComplete="tel"
                maxLength={16}
                value={user?.mobile || ""}
                onChange={(event) => setUser((current) => ({ ...current, mobile: event.target.value }))}
                style={inputStyle}
                required
            />
            <button type="submit" style={{ ...inputStyle, cursor: "pointer" }}>Save changes</button>
            <button type="button" onClick={hideUpdateSection} style={{ ...inputStyle, cursor: "pointer" }}>Cancel</button>
        </form>
    );
};

export default UpdateUser;
