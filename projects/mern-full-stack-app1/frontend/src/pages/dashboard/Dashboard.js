import React, { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";
import Swal from "sweetalert2";
import UpdateUser from "../../components/updateUser";
import AddUser from "../../components/addUser";
import api, { getErrorMessage } from "../../utils/api";

const Dashboard = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("createdAt");
    const [addOpen, setAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/contact")
            .then(({ data }) => { if (active) setContacts(data.contacts); })
            .catch((requestError) => { if (active) setError(getErrorMessage(requestError, "Unable to load contacts.")); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const visibleContacts = useMemo(() => {
        const query = search.trim().toLowerCase();
        const filtered = contacts.filter((contact) =>
            [contact.username, contact.email, contact.mobile].some((value) => value.toLowerCase().includes(query))
        );
        return filtered.sort((first, second) => {
            if (sort === "username") return first.username.localeCompare(second.username);
            if (sort === "updatedAt") return new Date(second.updatedAt) - new Date(first.updatedAt);
            return new Date(second.createdAt) - new Date(first.createdAt);
        });
    }, [contacts, search, sort]);

    const addContact = async (details) => {
        try {
            const { data } = await api.post("/contact", details);
            setContacts((current) => [data.contact, ...current]);
            setAddOpen(false);
            await Swal.fire({ icon: "success", title: data.message });
            return true;
        } catch (requestError) {
            await Swal.fire({ icon: "error", title: "Could not add contact", text: getErrorMessage(requestError, "Please try again.") });
            return false;
        }
    };

    const updateContact = async (id, details) => {
        try {
            const { data } = await api.patch("/contact/" + id, details);
            setContacts((current) => current.map((contact) => contact._id === id ? data.contact : contact));
            setEditing(null);
            await Swal.fire({ icon: "success", title: data.message });
        } catch (requestError) {
            await Swal.fire({ icon: "error", title: "Could not update contact", text: getErrorMessage(requestError, "Please try again.") });
        }
    };

    const deleteContact = async (contact) => {
        const confirmation = await Swal.fire({
            title: "Delete " + contact.username + "?",
            text: "This permanently removes the contact.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
        });
        if (!confirmation.isConfirmed) return;
        try {
            const { data } = await api.delete("/contact/" + contact._id);
            setContacts((current) => current.filter((item) => item._id !== contact._id));
            await Swal.fire({ icon: "success", title: data.message });
        } catch (requestError) {
            await Swal.fire({ icon: "error", title: "Could not delete contact", text: getErrorMessage(requestError, "Please try again.") });
        }
    };

    const showContact = (contact) => Swal.fire({
        title: contact.username,
        text: "Email: " + contact.email + "\nPhone: " + contact.mobile,
    });

    return (
        <div className={styles.container}>
            <button type="button" onClick={() => setAddOpen((open) => !open)} aria-expanded={addOpen}>{addOpen ? "Close form" : "Add contact"}</button>
            {addOpen && <AddUser onSave={addContact} cancelAction={() => setAddOpen(false)} />}

            <input type="search" className={styles.search} placeholder="Search contacts" value={search} onChange={(event) => setSearch(event.target.value)} />
            <div className={styles.filterData}>
                <h1>Contacts</h1>
                <button type="button" onClick={() => setSort("username")}>A-Z</button>
                <button type="button" onClick={() => setSort("updatedAt")}>Recently updated</button>
                <button type="button" onClick={() => setSort("createdAt")}>Recently added</button>
            </div>

            {error && <p role="alert">{error}</p>}
            {loading ? <p role="status">Loading contacts...</p> : visibleContacts.length ? (
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                    <tbody>
                        {visibleContacts.map((contact) => (
                            <tr key={contact._id}>
                                <td onClick={() => showContact(contact)}>{contact.username}</td>
                                <td onClick={() => showContact(contact)}>{contact.email}</td>
                                <td onClick={() => showContact(contact)}>{contact.mobile}</td>
                                <td>
                                    <button type="button" className={styles.edit} onClick={() => setEditing(contact)}>Edit</button>
                                    <button type="button" className={styles.delete} onClick={() => deleteContact(contact)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p>{search ? "No contacts match this search." : "No contacts yet. Add one to get started."}</p>}

            {editing && <div className={styles.editingForm} role="dialog" aria-modal="true" aria-label="Update contact">
                <UpdateUser item={editing} onSave={updateContact} closeClick={() => setEditing(null)} />
            </div>}
        </div>
    );
};

export default Dashboard;
