import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegEdit } from "react-icons/fa";
import { RiDeleteBin5Fill } from "react-icons/ri";
import Swal from "sweetalert2";
import styles from "./styles.module.scss";
import { useAuth } from "../../utils/auth";
import api from "../../utils/api";
import AddUser from "../../components/contact/AddUser";
import UpdateUser from "../../components/contact/UpdateUser";

const formatDate = (value) => value ? new Date(value).toLocaleString() : "—";

const Dashboard = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [editableUser, setEditableUser] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get("/user");
            if (!data.success) throw new Error(data.message || "Unable to load users.");
            setUsers(data.users);
        } catch (error) {
            if (error.response?.status === 401) {
                try { await auth.logout(); } catch { /* The protected route will return to login. */ }
            } else {
                await Swal.fire({ icon: "error", title: "Unable to load users", text: error.response?.data?.message || error.message });
            }
        } finally {
            setIsLoading(false);
        }
    }, [auth.logout]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const visibleUsers = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        return users
            .filter((user) => !query || [user.name, user.email, user.mobile].some((value) => String(value || "").toLowerCase().includes(query)))
            .slice()
            .sort((left, right) => {
                const leftValue = left[sort.key] || "";
                const rightValue = right[sort.key] || "";
                const comparison = sort.key.endsWith("At")
                    ? new Date(leftValue).getTime() - new Date(rightValue).getTime()
                    : String(leftValue).localeCompare(String(rightValue), undefined, { sensitivity: "base" });
                return sort.direction === "asc" ? comparison : -comparison;
            });
    }, [users, searchText, sort]);

    const toggleSort = (key) => {
        setSort((current) => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
    };

    const addUser = async (newUser) => {
        try {
            const { data } = await api.post("/user/add", newUser);
            if (!data.success || !data.user) throw new Error(data.message || "Unable to add this user.");
            setUsers((current) => [data.user, ...current]);
            setIsAddFormOpen(false);
            await Swal.fire({ icon: "success", title: "User added", text: data.message, timer: 1400, showConfirmButton: false });
            return true;
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Unable to add user", text: error.response?.data?.message || error.message });
            return false;
        }
    };

    const deleteUser = async (user) => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Delete this user?",
            text: user.name,
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
        });
        if (!result.isConfirmed) return;
        try {
            const { data } = await api.delete(`/user/${user._id}`);
            if (!data.success) throw new Error(data.message || "Unable to delete this user.");
            setUsers((current) => current.filter((item) => item._id !== user._id));
            await Swal.fire({ icon: "success", title: "User deleted", text: data.message, timer: 1400, showConfirmButton: false });
        } catch (error) {
            Swal.fire({ icon: "error", title: "Unable to delete user", text: error.response?.data?.message || error.message });
        }
    };

    const editUser = async (updatedUser) => {
        try {
            const { data } = await api.patch(`/user/${updatedUser._id}`, {
                name: updatedUser.name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
            });
            if (!data.success || !data.user) throw new Error(data.message || "Unable to update this user.");
            setUsers((current) => current.map((item) => item._id === data.user._id ? data.user : item));
            setEditableUser(null);
            await Swal.fire({ icon: "success", title: "User updated", text: data.message, timer: 1400, showConfirmButton: false });
        } catch (error) {
            Swal.fire({ icon: "error", title: "Unable to update user", text: error.response?.data?.message || error.message });
        }
    };

    const handleLogout = async () => {
        try {
            await auth.logout();
            navigate("/login", { replace: true });
        } catch {
            Swal.fire({ icon: "error", title: "Unable to log out", text: "Please try again." });
        }
    };

    const displayUser = (user) => {
        Swal.fire({
            title: user.name,
            text: `Email: ${user.email}\nMobile: ${user.mobile}`,
            confirmButtonText: "Close",
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.welcome}>
                Welcome {auth.admin?.name}
                <button type="button" onClick={handleLogout} className={styles.logoutButton}>Logout</button>
            </div>

            <section className={styles.contentContainer}>
                <h1 className={styles.heading}>User dashboard</h1>
                <button type="button" className={styles.addUserToggleButton} onClick={() => setIsAddFormOpen((open) => !open)} aria-expanded={isAddFormOpen}>
                    {isAddFormOpen ? "−" : "+"}
                </button>
                {isAddFormOpen && (
                    <div className={styles.addUserFormContainer}>
                        <AddUser onSave={addUser} hideAddUserForm={() => setIsAddFormOpen(false)} />
                    </div>
                )}

                <div className={styles.usersSections}>
                    <div className={styles.filterData}>
                        <h2 className={styles.filterDataHeading}>Users</h2>
                        <button type="button" onClick={() => toggleSort("name")}>Name {sort.key === "name" ? (sort.direction === "asc" ? "A–Z" : "Z–A") : "A–Z / Z–A"}</button>
                        <button type="button" onClick={() => toggleSort("updatedAt")}>Last modified</button>
                        <button type="button" onClick={() => toggleSort("createdAt")}>Last added</button>
                        <input type="search" className={styles.search} name="search" placeholder="Search name, email, or phone" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
                        <button type="button" onClick={fetchUsers} disabled={isLoading}>Refresh</button>
                    </div>

                    {isLoading ? <p role="status">Loading users…</p> : visibleUsers.length ? (
                        <div style={{ overflowX: "auto" }}>
                            <table className={styles.usersTable}>
                                <thead>
                                    <tr><th>Name</th><th>Mobile</th><th>Email</th><th>Created at</th><th>Updated at</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {visibleUsers.map((user) => (
                                        <tr key={user._id}>
                                            <td><button type="button" onClick={() => displayUser(user)} style={{ border: 0, background: "transparent", color: "inherit", cursor: "pointer" }}>{user.name}</button></td>
                                            <td>{user.mobile}</td>
                                            <td>{user.email}</td>
                                            <td>{formatDate(user.createdAt)}</td>
                                            <td>{formatDate(user.updatedAt)}</td>
                                            <td>
                                                <div className={styles.editDeleteContainer}>
                                                    <button type="button" aria-label={`Edit ${user.name}`} onClick={() => setEditableUser(user)} style={{ border: 0, background: "transparent", cursor: "pointer" }}><FaRegEdit className={styles.editIcon} /></button>
                                                    <button type="button" aria-label={`Delete ${user.name}`} onClick={() => deleteUser(user)} style={{ border: 0, background: "transparent", cursor: "pointer" }}><RiDeleteBin5Fill className={styles.deleteIcon} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p>{searchText ? "No users match that search." : "No users yet. Use + to add a user."}</p>
                    )}
                </div>
            </section>

            {editableUser && (
                <div className={`${styles.updateContainer} updateContainer`} style={{ display: "block" }}>
                    <button type="button" className={styles.closeUpdateContainer} onClick={() => setEditableUser(null)}>Close</button>
                    <div className={styles.updateFormContainer}>
                        <UpdateUser editableUser={editableUser} editUser={editUser} hideUpdateSection={() => setEditableUser(null)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
