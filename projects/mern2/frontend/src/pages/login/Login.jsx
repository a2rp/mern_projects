import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../utils/auth";
import api from "../../utils/api";
import styles from "./styles.module.scss";

const Login = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const [user, setUser] = useState({ email: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const { data } = await api.post("/admin/login", {
                email: user.email.trim(),
                password: user.password,
            });
            if (!data.success || !data.admin) throw new Error(data.message || "Unable to log in.");
            auth.login(data.admin);
            await Swal.fire({ icon: "success", title: "Login successful" });
            navigate("/dashboard", { replace: true });
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Login failed",
                text: error.response?.data?.message || error.message || "Unable to reach the API. Check that the server is running.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.heading}>Login</div>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email address"
                    name="email"
                    autoComplete="username"
                    value={user.email}
                    onChange={(event) => setUser((current) => ({ ...current, email: event.target.value }))}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    name="password"
                    autoComplete="current-password"
                    value={user.password}
                    onChange={(event) => setUser((current) => ({ ...current, password: event.target.value }))}
                    required
                />
                <input type="submit" className={styles.button} value={isLoading ? "Logging in…" : "Login"} disabled={isLoading} />
            </form>
            <p>Need an account? <Link to="/register">Register</Link></p>
        </div>
    );
};

export default Login;
