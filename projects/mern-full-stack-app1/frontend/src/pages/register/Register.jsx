import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Header from "../../components/header/Header";
import styles from "./styles.module.scss";
import { useAuth } from "../../utils/auth";
import api, { getErrorMessage } from "../../utils/api";

const stateByCity = { mumbai: "maharashtra", pune: "maharashtra", ahmedabad: "gujarat" };

const Register = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const [form, setForm] = useState({
        name: "", email: "", phone: "", gender: "male", city: "mumbai",
        password: "", confirmPassword: "",
    });
    const [hearAbout, setHearAbout] = useState({ linkedin: false, friends: false, job_portal: false, others: false });
    const [loading, setLoading] = useState(false);
    const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    const toggleHearAbout = (event) => setHearAbout((current) => ({ ...current, [event.target.name]: event.target.checked }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (form.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || !/^\+?\d{7,15}$/.test(form.phone.trim())) {
            await Swal.fire({ icon: "error", title: "Enter a valid name, email, and phone number." });
            return;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,72}$/.test(form.password)) {
            await Swal.fire({ icon: "error", title: "Use 12-72 characters with uppercase, lowercase, a number, and a symbol." });
            return;
        }
        if (form.password !== form.confirmPassword) {
            await Swal.fire({ icon: "error", title: "Passwords do not match." });
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/user/register", {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                gender: form.gender,
                hear_about_this: hearAbout,
                city: form.city,
                state: stateByCity[form.city],
                password: form.password,
                confirm_password: form.confirmPassword,
            });
            auth.login(data.user);
            navigate("/home", { replace: true });
        } catch (error) {
            await Swal.fire({ icon: "error", title: "Registration failed", text: getErrorMessage(error, "Check the details and try again.") });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.contentContainer}>
                <h2 className={styles.heading}>Create account</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="name">Name</label>
                    <input id="name" type="text" name="name" value={form.name} onChange={update} autoComplete="name" required minLength="2" maxLength="80" />
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" name="email" value={form.email} onChange={update} autoComplete="email" required />
                    <label htmlFor="phone">Phone number</label>
                    <input id="phone" type="tel" name="phone" value={form.phone} onChange={update} autoComplete="tel" required />

                    <label>Gender</label>
                    <div className={styles.genderContainer}>
                        {["male", "female", "others"].map((gender) => (
                            <label key={gender}><input type="radio" name="gender" value={gender} checked={form.gender === gender} onChange={update} /> {gender}</label>
                        ))}
                    </div>

                    <label>How did you hear about this?</label>
                    <div className={styles.hearAboutThisContainer}>
                        {[["linkedin", "LinkedIn"], ["friends", "Friends"], ["job_portal", "Job portal"], ["others", "Other"]].map(([key, label]) => (
                            <label key={key}><input type="checkbox" name={key} checked={hearAbout[key]} onChange={toggleHearAbout} /> {label}</label>
                        ))}
                    </div>

                    <label htmlFor="city">City</label>
                    <select id="city" name="city" className="city" value={form.city} onChange={update}>
                        <option value="mumbai">Mumbai</option>
                        <option value="pune">Pune</option>
                        <option value="ahmedabad">Ahmedabad</option>
                    </select>
                    <p>State: {stateByCity[form.city]}</p>

                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" name="password" value={form.password} onChange={update} autoComplete="new-password" required minLength="12" maxLength="72" />
                    <label htmlFor="confirmPassword">Confirm password</label>
                    <input id="confirmPassword" type="password" name="confirmPassword" value={form.confirmPassword} onChange={update} autoComplete="new-password" required minLength="12" maxLength="72" />
                    <button type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
                </form>
            </div>
        </div>
    );
};

export default Register;
