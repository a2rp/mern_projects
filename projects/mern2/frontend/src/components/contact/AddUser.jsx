import { useState } from 'react';
import Swal from "sweetalert2";

const AddUser = ({ onSave, hideAddUserForm }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();

        if (!name.trim() || !mobile.trim() || !email.trim()) {
            return Swal.fire({
                icon: 'error',
                title: 'All fields required'
            })
        }

        setIsSaving(true);
        try {
            const saved = await onSave({ name: name.trim(), mobile: mobile.trim(), email: email.trim() });
            if (!saved) return;
            setName('');
            setMobile('');
            setEmail('');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={onSubmit} style={{ padding: "15px" }}>
            <input
                style={{
                    display: "block",
                    width: "100%",
                    paddingLeft: "15px",
                    height: "30px",
                }}
                type="text"
                placeholder="Name"
                aria-label="Name"
                maxLength={120}
                required
                value={name}
                onChange={(event) => setName(event.target.value)} />

            <input
                style={{
                    display: "block",
                    width: "100%",
                    paddingLeft: "15px",
                    height: "30px",
                    marginTop: "5px"
                }}
                type="tel"
                placeholder="Mobile"
                aria-label="Mobile"
                maxLength={24}
                required
                value={mobile}
                onChange={(event) => setMobile(event.target.value)} />

            <input
                style={{
                    display: "block",
                    width: "100%",
                    paddingLeft: "15px",
                    height: "30px",
                    marginTop: "5px"
                }}
                type="email"
                placeholder="Email"
                aria-label="Email"
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)} />

            <input
                style={{
                    display: "inline-block",
                    width: "48%",
                    paddingLeft: "15px",
                    height: "30px",
                    marginTop: "5px",
                    border: "none",
                    backgroundColor: "green",
                    color: "#fff"
                }}
                type="submit"
                value={isSaving ? "Saving…" : "Save"}
                disabled={isSaving} />

            <input
                style={{
                    display: "inline-block",
                    float: "right",
                    width: "48%",
                    paddingLeft: "15px",
                    height: "30px",
                    marginTop: "5px",
                    border: "none",
                    backgroundColor: "orangered",
                    color: "#fff"
                }}
                type="button"
                value="Cancel"
                disabled={isSaving}
                onClick={hideAddUserForm} />
        </form>
    )
}

export default AddUser
