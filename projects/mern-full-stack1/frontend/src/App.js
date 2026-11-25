import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { FaCode, FaCodepen, FaCoffee, FaFacebook, FaGithub, FaHeart, FaLinkedin, FaMailBulk, FaPatreon, FaYoutube } from "react-icons/fa";
import { FiArrowUp, FiLayers, FiShield } from "react-icons/fi";
import styles from "./styles.module.scss";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import Register from "./pages/register";
import NoMatchRoute from "./pages/noMatchRoute";
import NavBar from "./components/navbar";
import { AuthProvider } from "./utils/auth";
import RequireAuth from "./utils/RequireAuth";
import HasAuth from "./utils/HasAuth";

const footerLinks = [
    { label: "Portfolio", href: "https://www.ashishranjan.net/", icon: FaCode },
    { label: "GitHub", href: "https://github.com/a2rp", icon: FaGithub },
    { label: "CodePen", href: "https://codepen.io/ash1198", icon: FaCodepen },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/aashishranjan", icon: FaLinkedin },
    { label: "Facebook", href: "https://www.facebook.com/theash.ashish/", icon: FaFacebook },
    { label: "YouTube", href: "https://www.youtube.com/@ashishranjan-ashz?sub_confirmation=1", icon: FaYoutube },
    { label: "Email", href: "mailto:ash.ranjan09@gmail.com", icon: FaMailBulk },
    { label: "Support", href: "https://a2rp-donation-page.netlify.app/", icon: FaHeart },
    { label: "Buy Me a Coffee", href: "https://buymeacoffee.com/a2rp", icon: FaCoffee },
    { label: "Patreon", href: "https://patreon.com/a2rp", icon: FaPatreon },
];

function App() {
    const [showTopButton, setShowTopButton] = useState(false);
    useEffect(() => {
        const handleScroll = () => setShowTopButton(window.scrollY > 260);
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className={styles.container} id="top">
            <AuthProvider>
                <NavBar />
                <main className={styles.routesContainer}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                        <Route path="/login" element={<HasAuth><Login /></HasAuth>} />
                        <Route path="/register" element={<HasAuth><Register /></HasAuth>} />
                        <Route path="*" element={<NoMatchRoute />} />
                    </Routes>
                </main>
                <footer className={styles.footer}>
                    <div className={styles.footerIntro}><p className={styles.eyebrow}>Full-stack learning project</p><p>Authentication, protected routes, and MongoDB-backed user management in one workspace.</p></div>
                    <div className={styles.footerFeatures}><span><FiShield aria-hidden="true" /> Protected routes</span><span><FiLayers aria-hidden="true" /> User CRUD</span></div>
                    <nav className={styles.socialLinks} aria-label="Social and support links">
                        {footerLinks.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}><Icon aria-hidden="true" /><span className={styles.srOnly}>{label}</span></a>)}
                    </nav>
                    <div className={styles.footerBottom}>Copyright © {new Date().getFullYear()} <a href="https://www.ashishranjan.net" target="_blank" rel="noopener noreferrer">Ashish Ranjan</a></div>
                </footer>
            </AuthProvider>
            <button className={`${styles.topButton} ${showTopButton ? styles.topButtonVisible : ""}`} type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Go to top"><FiArrowUp aria-hidden="true" /></button>
        </div>
    );
}

export default App;
