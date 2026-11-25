import React from "react";
import styles from "./styles.module.scss";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/auth";

const Header = () => {
    const { user, status, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await logout(); } catch (_) {}
        navigate("/login", { replace: true });
    };

    const navStyle = ({ isActive }) => ({ color: isActive ? "blue" : "white" });

    return (
        <div className={styles.container}>
            <NavLink to="/home" className={styles.homeNavLink} style={navStyle}>Home</NavLink>
            <div className={styles.loginRegisterContainer}>
                {user ? (
                    <button type="button" className={styles.loginNavLink} onClick={handleLogout}>Logout</button>
                ) : status !== "checking" ? (
                    <>
                        <NavLink to="/login" className={styles.loginNavLink} style={navStyle}>Login</NavLink>
                        <NavLink to="/register" className={styles.registerNavLink} style={navStyle}>Register</NavLink>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default Header;
