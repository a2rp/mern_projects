import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import styles from "./styles.module.scss";
import { useAuth } from "../../utils/auth";
import api from "../../utils/api";

const initialContact = { name: "", email: "", phone: "" };
const cityState = { mumbai: "maharashtra", pune: "maharashtra", ahmedabad: "gujarat" };
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,72}$/;

const Register = () => {
    const [profile, setProfile] = useState(initialContact);
    const [gender, setGender] = useState("male");
    const [hearAboutThis, setHearAboutThis] = useState({ linkedin: false, friends: false, job_portal: false, others: false });
    const [city, setCity] = useState("mumbai");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registrationKey, setRegistrationKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (profile.name.trim().length < 2 || profile.name.trim().length > 80) {
            return Swal.fire({ icon: "error", title: "Check your name", text: "Use between 2 and 80 characters." });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()) || profile.email.length > 254) {
            return Swal.fire({ icon: "error", title: "Check your email", text: "Enter a valid email address." });
        }
        if (!/^\+?\d{7,15}$/.test(profile.phone.trim())) {
            return Swal.fire({ icon: "error", title: "Check your phone number", text: "Use 7 to 15 digits, with an optional leading +." });
        }
        if (!passwordPattern.test(password) || new TextEncoder().encode(password).length > 72) {
            return Swal.fire({ icon: "error", title: "Choose a stronger password", text: "Use 12–72 characters with uppercase and lowercase letters, a number, and a symbol." });
        }
        if (password !== confirmPassword) {
            return Swal.fire({ icon: "error", title: "Passwords do not match" });
        }
        if (new TextEncoder().encode(registrationKey).length < 32) {
            return Swal.fire({ icon: "error", title: "Enter the admin registration key" });
        }

        setIsLoading(true);
        try {
            const { data } = await api.post("/admin/register", {
                ...profile,
                email: profile.email.trim(),
                phone: profile.phone.trim(),
                gender,
                hear_about_this: hearAboutThis,
                city,
                state: cityState[city],
                password,
                confirm_password: confirmPassword,
            }, { headers: { "X-Admin-Registration-Key": registrationKey.trim() } });
            if (!data.success || !data.admin) throw new Error(data.message || "Unable to create the account.");
            auth.login(data.admin);
            await Swal.fire({ icon: "success", title: "Account created", text: data.message, timer: 1500, showConfirmButton: false });
            navigate("/dashboard", { replace: true });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Unable to register",
                text: error.response?.data?.message || error.message || "Check your connection and try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleReferral = (event) => {
        const { name, checked } = event.target;
        setHearAboutThis((current) => ({ ...current, [name]: checked }));
    };

    return (
        <div className={styles.container}>
            <div className={styles.contentContainer}>
                <h1 className={styles.heading}>Create an admin account</h1>
                <p>Admin registration requires the key configured on the API server.</p>
                <form onSubmit={handleSubmit}>
                    <div className={styles.section1}>
                        <input type="text" name="name" autoComplete="name" maxLength={80} value={profile.name} placeholder="Your name" onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required />
                        <input type="email" name="email" autoComplete="email" maxLength={254} value={profile.email} placeholder="Your email" onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} required />
                        <input type="tel" name="phone" autoComplete="tel" inputMode="tel" maxLength={16} value={profile.phone} placeholder="Your phone number" onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} required />
                    </div>

                    <div className={styles.genderHear}>
                        <fieldset>
                            <legend>Gender</legend>
                            {[["male", "Male"], ["female", "Female"], ["others", "Other"]].map(([value, label]) => (
                                <label key={value}>
                                    <input type="radio" value={value} name="gender" checked={gender === value} onChange={(event) => setGender(event.target.value)} /> {label}
                                </label>
                            ))}
                        </fieldset>
                        <fieldset>
                            <legend>How did you hear about this?</legend>
                            {[["linkedin", "LinkedIn"], ["friends", "Friends"], ["job_portal", "Job portal"], ["others", "Other"]].map(([name, label]) => (
                                <label key={name}>
                                    <input type="checkbox" name={name} checked={hearAboutThis[name]} onChange={toggleReferral} /> {label}
                                </label>
                            ))}
                        </fieldset>
                    </div>

                    <div className={styles.section2}>
                        <div>
                            <label htmlFor="city">City</label>
                            <select id="city" name="city" className={styles.city} value={city} onChange={(event) => setCity(event.target.value)}>
                                <option value="mumbai">Mumbai</option>
                                <option value="pune">Pune</option>
                                <option value="ahmedabad">Ahmedabad</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="state">State</label>
                            <input id="state" name="state" value={cityState[city]} readOnly />
                        </div>
                    </div>

                    <div className={styles.section3}>
                        <input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={72} value={password} placeholder="Create a password" onChange={(event) => setPassword(event.target.value)} required />
                        <input type="password" name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={72} value={confirmPassword} placeholder="Confirm your password" onChange={(event) => setConfirmPassword(event.target.value)} required />
                    </div>

                    <label htmlFor="registrationKey">Admin registration key</label>
                    <input id="registrationKey" name="registrationKey" type="password" autoComplete="off" value={registrationKey} onChange={(event) => setRegistrationKey(event.target.value)} required />
                    <button type="submit" disabled={isLoading}>{isLoading ? "Creating account…" : "Create admin account"}</button>
                </form>
            </div>
        </div>
    );
};

export default Register;
