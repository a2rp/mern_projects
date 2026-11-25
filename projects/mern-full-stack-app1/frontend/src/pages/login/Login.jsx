import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Header from "../../components/header/Header";
import styles from "./styles.module.scss";
import { useAuth } from "../../utils/auth";
import api, { getErrorMessage } from "../../utils/api";

const Login = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post("/user/login", form);
            auth.login(data.user);
            navigate("/home", { replace: true });
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Login failed", text: getErrorMessage(error, "Check your email and password.") });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.contentContainer}>
                <h2 className={styles.heading}>Login account</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" name="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" name="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                    <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Submit"}</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
