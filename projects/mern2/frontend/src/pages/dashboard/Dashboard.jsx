import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegEdit } from "react-icons/fa";
import { RiDeleteBin5Fill } from "react-icons/ri";
import Swal from "sweetalert2";
import { useAuth } from "../../utils/auth";
import api from "../../utils/api";
import AddUser from "../../components/contact/AddUser";
import UpdateUser from "../../components/contact/UpdateUser";
import styles from "./styles.module.scss";

const displayDate = (value) => value ? new Date(value).toLocaleString() : "—";

const Dashboard = () => {
    const navigate = useNavigate();
    const { admin, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [displayAddUserForm, setDisplayAddUserForm] = useState(true);
    const [editableUser, setEditableUser] = useState(null);
    const [toggleUpdateContainer, setToggleUpdateContainer] = useState(false);
    const [sortName, setSortName] = useState(true);
    const [lastModified, setLastModified] = useState(true);
    const [lastInserted, setLastInserted] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const { data } = await api.get("/user");
            if (!data.success || !Array.isArray(data.users)) throw new Error(data.message || "The API returned invalid user data.");
            setUsers(data.users);
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Unable to load your records.";
            setLoadError(message);
            if (error.response?.status === 401) {
                await logout();
                navigate("/login", { replace: true });
            } else {
                Swal.fire({ icon: "error", title: "Unable to load users", text: message });
            }
        } finally {
            setIsLoading(false);
        }
    }, [logout, navigate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const toggleAddUserForm = () => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        setDisplayAddUserForm((open) => !open);
    };
    const hideAddUserForm = () => setDisplayAddUserForm(true);

    useEffect(() => {
        const form = document.querySelector(".addUserFormContainer");
        if (form) form.style.height = displayAddUserForm ? "0" : "165px";
    }, [displayAddUserForm]);

    const addUser = async (user) => {
        try {
            const { data } = await api.post("/user/add", user);
            setUsers((current) => [...current, data.user]);
            hideAddUserForm();
            await Swal.fire({ icon: "success", title: "User added" });
            return true;
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Unable to add user", text: error.response?.data?.message || error.message });
            return false;
        }
    };

    const deleteUser = async (id) => {
        const confirmation = await Swal.fire({
            title: "Remove this user?",
            text: "This record will be permanently removed from your account.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Remove user",
            cancelButtonText: "Keep user",
        });
        if (!confirmation.isConfirmed) return;
        try {
            await api.delete(`/user/${id}`);
            setUsers((current) => current.filter((user) => user.id !== id));
            await Swal.fire({ icon: "success", title: "User removed" });
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Unable to remove user", text: error.response?.data?.message || error.message });
        }
    };

    const displayUpdateSection = (id) => {
        const user = users.find((item) => item.id === id);
        if (!user) return;
        setEditableUser(user);
        setToggleUpdateContainer(true);
    };
    const hideUpdateSection = () => setToggleUpdateContainer(false);

    useEffect(() => {
        const container = document.querySelector(".updateContainer");
        if (container) container.style.display = toggleUpdateContainer ? "block" : "none";
    }, [toggleUpdateContainer]);

    const editUser = async (updatedUser) => {
        try {
            const { data } = await api.put(`/user/${updatedUser.id}`, {
                name: updatedUser.name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
            });
            setUsers((current) => current.map((user) => user.id === updatedUser.id ? data.user : user));
            hideUpdateSection();
            await Swal.fire({ icon: "success", title: "User updated" });
            return true;
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Unable to update user", text: error.response?.data?.message || error.message });
            return false;
        }
    };

    const sortByName = () => {
        setUsers((current) => [...current].sort((a, b) => sortName
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)));
        setSortName((current) => !current);
    };
    const sortByLastModified = () => {
        setUsers((current) => [...current].sort((a, b) => lastModified
            ? new Date(b.updatedAt) - new Date(a.updatedAt)
            : new Date(a.updatedAt) - new Date(b.updatedAt)));
        setLastModified((current) => !current);
    };
    const sortByLastInserted = () => {
        setUsers((current) => [...current].sort((a, b) => lastInserted
            ? new Date(b.createdAt) - new Date(a.createdAt)
            : new Date(a.createdAt) - new Date(b.createdAt)));
        setLastInserted((current) => !current);
    };

    const displayData = (user) => Swal.fire({
        title: "User details",
        text: `Name: ${user.name}\nMobile: ${user.mobile}\nEmail: ${user.email}`,
    });

    return (
        <div className={styles.container}>
            <div className={styles.welcome}>
                Welcome {admin?.name || admin?.email}
                <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
            </div>

            <div className={styles.contentContainer}>
                <div className={styles.heading}>Dashboard</div>
                <button className={styles.addUserToggleButton} type="button" onClick={toggleAddUserForm} aria-label="Toggle add user form">+</button>
                <div className={`${styles.addUserFormContainer} addUserFormContainer`}>
                    <AddUser onSave={addUser} hideAddUserForm={hideAddUserForm} />
                </div>

                <div className={styles.usersSections}>
                    <div className={styles.filterData}>
                        <h1 className={styles.filterDataHeading}>Your users</h1>
                        <button type="button" onClick={sortByName}>A-Z / Z-A</button>
                        <button type="button" onClick={sortByLastModified}>Last modified</button>
                        <button type="button" onClick={sortByLastInserted}>Last inserted</button>
                        <button type="button" onClick={fetchData} disabled={isLoading}>{isLoading ? "Refreshing…" : "Refresh"}</button>
                    </div>
                    {loadError && <p role="alert">{loadError}</p>}
                    {isLoading ? <p role="status">Loading your users…</p> : users.length > 0 ? (
                        <table className={styles.usersTable}>
                            <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Created At</th><th>Updated At</th><th>Action</th></tr></thead>
                            <tbody>{users.map((user) => (
                                <tr key={user.id}>
                                    <td onClick={() => displayData(user)}>{user.name}</td>
                                    <td onClick={() => displayData(user)}>{user.mobile}</td>
                                    <td onClick={() => displayData(user)}>{user.email}</td>
                                    <td>{displayDate(user.createdAt)}</td>
                                    <td>{displayDate(user.updatedAt)}</td>
                                    <td><div className={styles.editDeleteContainer}>
                                        <button className={styles.editIcon} type="button" onClick={() => displayUpdateSection(user.id)} aria-label={`Edit ${user.name}`}><FaRegEdit /></button>
                                        <button className={styles.deleteIcon} type="button" onClick={() => deleteUser(user.id)} aria-label={`Delete ${user.name}`}><RiDeleteBin5Fill /></button>
                                    </div></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    ) : <p>No users yet. Add a user to start your private list.</p>}
                </div>
            </div>

            <div className={`${styles.updateContainer} updateContainer`}>
                <button className={styles.closeUpdateContainer} type="button" onClick={hideUpdateSection}>Close</button>
                <div className={styles.updateFormContainer}>
                    {toggleUpdateContainer && <UpdateUser editableUser={editableUser} editUser={editUser} hideUpdateSection={hideUpdateSection} />}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
