import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import styles from "./styles.module.scss";
import { useAuth } from "../../utils/auth";
import api from "../../utils/api";

const Login = () => {
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const { data } = await api.post("/admin/login", {
                email: credentials.email.trim(),
                password: credentials.password,
            });
            if (!data.success || !data.admin) throw new Error(data.message || "Unable to log in.");
            auth.login(data.admin);
            await Swal.fire({ icon: "success", title: "Login successful", text: data.message, timer: 1400, showConfirmButton: false });
            navigate("/dashboard", { replace: true });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Unable to log in",
                text: error.response?.data?.message || error.message || "Check your connection and try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Admin login</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email address</label>
                <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    maxLength={254}
                    value={credentials.email}
                    onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                />
                <label htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    maxLength={72}
                    value={credentials.password}
                    onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                />
                <button type="submit" className={styles.button} disabled={isLoading}>
                    {isLoading ? "Signing in…" : "Login"}
                </button>
            </form>
            <p>Need an account? <Link to="/register">Register with an admin key</Link></p>
        </div>
    );
};

export default Login;
