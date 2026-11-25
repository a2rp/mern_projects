import React, { useEffect, useState } from 'react';

const UpdateUser = ({ editableUser, editUser, hideUpdateSection }) => {
    const [user, setUser] = useState({ name: "", email: "", mobile: "" });

    const updateUser = async (event) => {
        event.preventDefault();
        await editUser({ id: user.id, name: user.name.trim(), mobile: user.mobile.trim(), email: user.email.trim() });
    };

    useEffect(() => {
        setUser(editableUser);
    }, [editableUser]);

    return (
        <form onSubmit={updateUser}>
            <div style={{ fontSize: "20px", color: "#000", textAlign: "center" }}>
                UPDATE USER
            </div>
            <input
                type="text"
                placeholder='name'
                aria-label="Name"
                maxLength={120}
                required
                value={user.name}
                onChange={(event) => setUser({ ...user, name: event.target.value })}
                style={{
                    marginTop: "15px",
                    width: "100%",
                    height: "30px",
                    paddingLeft: "15px",
                }} />

            <input
                type="email"
                placeholder='email'
                aria-label="Email"
                maxLength={254}
                required
                value={user.email}
                onChange={(event) => setUser({ ...user, email: event.target.value })}
                style={{
                    marginTop: "15px",
                    width: "100%",
                    height: "30px",
                    paddingLeft: "15px",
                }} />

            <input
                type="text"
                placeholder='mobile'
                aria-label="Mobile"
                maxLength={24}
                required
                value={user.mobile}
                onChange={(event) => setUser({ ...user, mobile: event.target.value })}
                style={{
                    marginTop: "15px",
                    width: "100%",
                    height: "30px",
                    paddingLeft: "15px",
                }} />

            <input
                value="Update"
                type="submit"
                style={{
                    marginTop: "15px",
                    width: "100%",
                    height: "30px"
                }} />

            <input
                type="button"
                value="Cancel"
                onClick={hideUpdateSection}
                style={{
                    marginTop: "15px",
                    width: "100%",
                    height: "30px",
                }} />
        </form>
    )
}

export default UpdateUser
