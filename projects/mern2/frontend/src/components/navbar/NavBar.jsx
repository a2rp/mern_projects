import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FiBookOpen, FiHome, FiLogIn, FiMenu, FiUserPlus, FiX } from "react-icons/fi";
import styles from "./styles.module.scss";

const links = [
  { to: "/home", label: "Home", icon: FiHome },
  { to: "/dashboard", label: "Dashboard", icon: FiBookOpen },
  { to: "/register", label: "Register", icon: FiUserPlus },
  { to: "/login", label: "Login", icon: FiLogIn },
];

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const linkClassName = ({ isActive }) => `${styles.navlink} ${isActive ? styles.active : ""}`;

  return (
    <header className={styles.container}>
      <a className={styles.brand} href="#top" onClick={() => setMenuOpen(false)}>
        <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Ashish Ranjan logo" />
        <span><small>Auth workspace</small><strong>MERN2</strong></span>
      </a>
      <button className={styles.menuButton} type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? "Close menu" : "Open menu"}>
        {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
      </button>
      <nav id="main-navigation" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`} aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={linkClassName} onClick={() => setMenuOpen(false)}><Icon aria-hidden="true" />{label}</NavLink>)}
      </nav>
    </header>
  );
}

export default NavBar;