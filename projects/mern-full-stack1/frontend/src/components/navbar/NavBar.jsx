import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiBookOpen, FiHome, FiLogIn, FiMenu, FiUserPlus, FiX } from "react-icons/fi";
import Swal from "sweetalert2";
import { useAuth } from "../../utils/auth";
import styles from "./styles.module.scss";

function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { admin, status, logout } = useAuth();
    const navigate = useNavigate();
    const linkClassName = ({ isActive }) => `${styles.navlink} ${isActive ? styles.active : ""}`;

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: "Log out of your account?",
            showCancelButton: true,
            confirmButtonText: "Log out",
            cancelButtonText: "Cancel",
        });
        if (!result.isConfirmed) return;
        try {
            await logout();
            setMenuOpen(false);
            navigate("/login", { replace: true });
        } catch {
            Swal.fire({ icon: "error", title: "Unable to log out", text: "Please try again." });
        }
    };

    return (
        <header className={styles.container}>
            <a className={styles.brand} href="#top" onClick={() => setMenuOpen(false)}>
                <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Ashish Ranjan logo" />
                <span><small>Auth and CRUD workspace</small><strong>Full Stack 1</strong></span>
            </a>
            <button className={styles.menuButton} type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? "Close menu" : "Open menu"}>
                {menuOpen ? <FiX /> : <FiMenu />}
            </button>
            <nav id="main-navigation" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`} aria-label="Main navigation">
                <NavLink to="/home" className={linkClassName} onClick={() => setMenuOpen(false)}><FiHome aria-hidden="true" />Home</NavLink>
                {status === "authenticated" && <NavLink to="/dashboard" className={linkClassName} onClick={() => setMenuOpen(false)}><FiBookOpen aria-hidden="true" />Dashboard</NavLink>}
                {status === "anonymous" && <NavLink to="/register" className={linkClassName} onClick={() => setMenuOpen(false)}><FiUserPlus aria-hidden="true" />Register</NavLink>}
                {status === "anonymous" && <NavLink to="/login" className={linkClassName} onClick={() => setMenuOpen(false)}><FiLogIn aria-hidden="true" />Login</NavLink>}
                {status === "authenticated" && (
                    <button type="button" className={styles.navlink} style={{ background: "transparent", cursor: "pointer" }} onClick={handleLogout}>
                        {admin?.name ? `Log out (${admin.name})` : "Log out"}
                    </button>
                )}
            </nav>
        </header>
    );
}

export default NavBar;
