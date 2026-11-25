import React, { useEffect, useState } from "react";

import styles from "./styles.module.scss";
import Swal from 'sweetalert2'
import api from '../../utils/api';


const Register = () => {
    const handleError = (err) => {
        Swal.fire({
            title: 'Error!',
            text: err,
            icon: 'error',
            confirmButtonText: 'Okay'
        });
    }
    const handleSuccess = (msg) => {
        Swal.fire({
            title: 'Success!',
            text: msg,
            icon: 'success',
            confirmButtonText: 'Okay'
        });
    }

    // name email phone inputs
    const [nameEmailPhoneIputs, setNameEmailPhoneInputs] = useState({
        name: "",
        email: "",
        phone: ""
    });
    const handleOnChange = (event) => {
        const { name, value } = event.target;
        setNameEmailPhoneInputs({
            ...nameEmailPhoneIputs,
            [name]: value,
        });
    };
    const validNameEmailPhoneInputs = () => {
        // name
        if (nameEmailPhoneIputs.name.trim().length === 0
            || !nameEmailPhoneIputs.name.match("^[a-zA-Z ]*$")) {
            handleError("Invalid Name [only alphabets allowed]");
            return false;
        }

        // email
        if (nameEmailPhoneIputs.email.trim().length === 0 || !nameEmailPhoneIputs.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            handleError("Invalid Email [only alphanumeric allowed]");
            return false;
        }

        // only numbers
        if (nameEmailPhoneIputs.phone.trim().length === 0 || !nameEmailPhoneIputs.phone.match(/^[0-9]*$/)) {
            handleError("Invalid Phone Number [only numbers allowed]");
            return false;
        }

        return true;
    };
    // name email phone inputs

    // gender
    const [gender, setGender] = useState("male");
    function onGenderChange(event) {
        setGender(event.target.value);
    }

    // hear about this
    const [hearAboutThis, setHearAboutThis] = useState({
        linkedin: false,
        friends: false,
        job_portal: false,
        others: false,
    });

    // city
    const [city, setCity] = useState("mumbai");
    const handleCityChange = (event) => {
        setCity(event.target.value);
    };

    // state
    const [state, setState] = useState("Maharashtra");
    useEffect(() => {
        if (city === "mumbai") {
            setState(state => "maharashtra");
        } else if (city === "pune") {
            setState(state => "maharashtra");
        } else if (city === "ahmedabad") {
            setState(state => "gujarat");
        }
    }, [city]);

    const [password, setPassword] = useState("");
    const handlePasswordChange = (event) => {
        setPassword(event.currentTarget.value);
    };

    const [confirmPassword, setConfirmPassword] = useState("");
    const handleConfirmPasswordChange = (event) => {
        setConfirmPassword(event.currentTarget.value);
    };

    const validatePassword = () => {
        if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,128}$/)) {
            handleError('Use 12 to 128 characters with an uppercase letter, lowercase letter, number, and symbol.');
            return false;
        }

        if (password !== confirmPassword) {
            handleError('Passwords do not match');
            return false;
        }

        return true;
    };

    // submit form
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (event) => {
        event.preventDefault();

        const inputs = {
            ...nameEmailPhoneIputs,
            gender,
            hear_about_this: hearAboutThis,
            city,
            state,
            password,
            confirm_password: confirmPassword
        };
        // return;

        if (!validNameEmailPhoneInputs()) return;
        if (!validatePassword()) return;

        try {
            setIsLoading(true);
            const response = await api.post("/admin/register", inputs);
            const { success, message } = response.data;
            if (success) {
                handleSuccess(message);
                // setTimeout(() => {
                //     navigate("/login");
                // }, 1000);
            } else {
                handleError(message);
            }
        } catch (error) {
            handleError(error.response?.data?.message || error.message || "Unable to reach the API.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>

            <div className={styles.contentContainer}>
                <h2 className={styles.heading}>Register</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.section1}>
                        {/* name */}
                        <input
                            type="text"
                            name="name"
                            value={nameEmailPhoneIputs.name}
                            placeholder="Your name"
                            onChange={handleOnChange}
                            maxLength={120}
                            required
                        />

                        {/* email */}
                        <input
                            type="email"
                            name="email"
                            value={nameEmailPhoneIputs.email}
                            placeholder="Your email"
                            onChange={handleOnChange}
                            maxLength={254}
                            required
                        />

                        {/* phone number */}
                        <input
                            type="tel"
                            name="phone"
                            value={nameEmailPhoneIputs.phone}
                            placeholder="Your phone number"
                            onChange={handleOnChange}
                            maxLength={24}
                            required
                        />
                    </div>

                    <div className={styles.genderHear}>
                        {/* gender */}
                        <div>
                            <label>Gender</label>
                            <div className={styles.genderContainer}>
                                <div>
                                    <input
                                        type="radio"
                                        value="male"
                                        name="gender"
                                        checked={gender === "male"}
                                        onChange={onGenderChange} /> Male
                                </div>
                                <div>
                                    <input
                                        type="radio"
                                        value="female"
                                        name="gender"
                                        checked={gender === "female"}
                                        onChange={onGenderChange} /> Female
                                </div>
                                <div>
                                    <input
                                        type="radio"
                                        value="others"
                                        name="gender"
                                        checked={gender === "others"}
                                        onChange={onGenderChange} /> Others
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="hear_about_this">How did you hear about this ???</label>
                            <div className={styles.hearAboutThisContainer}>
                                <div>
                                    <input type="checkbox" name="linkedin" value="linkedin" defaultChecked={hearAboutThis.linkedin} onChange={() => setHearAboutThis({
                                        ...hearAboutThis, linkedin: !hearAboutThis.linkedin
                                    })} /> LinkedIn
                                </div>
                                <div>
                                    <input type="checkbox" name="friends" value="friends" defaultChecked={hearAboutThis.friends} onChange={() => setHearAboutThis({
                                        ...hearAboutThis, friends: !hearAboutThis.friends
                                    })} /> Friends
                                </div>
                                <div>
                                    <input type="checkbox" name="job_portal" value="job_portal" defaultChecked={hearAboutThis.job_portal} onChange={() => setHearAboutThis({
                                        ...hearAboutThis, job_portal: !hearAboutThis.job_portal
                                    })} /> Job Portal
                                </div>
                                <div>
                                    <input type="checkbox" name="others" value="others" defaultChecked={hearAboutThis.others} onChange={() => setHearAboutThis({
                                        ...hearAboutThis, others: !hearAboutThis.others
                                    })} /> Others
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section2}>
                        <div>
                            <label htmlFor="city">City</label>
                            <select name="city" className={styles.city} onChange={handleCityChange}>
                                <option value="mumbai">Mumbai</option>
                                <option value="pune">Pune</option>
                                <option value="ahmedabad">Ahmedabad</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="state">State</label>
                            <select name="state" className={styles.state} value={state} disabled>
                                <option>Auto Suggested State: select city above</option>
                                <option value="gujarat" disabled>Gujarat</option>
                                <option value="maharashtra" disabled>Maharashtra</option>
                                <option value="karnataka" disabled>Karnataka</option>
                            </select>
                        </div>
                    </div>


                    <div className={styles.section3}>
                        {/* password */}
                        <input
                            type="password"
                            name="password"
                            value={password}
                            placeholder="Enter your password"
                            autoComplete="new-password"
                            minLength={12}
                            maxLength={128}
                            required
                            onChange={handlePasswordChange}
                        />

                        {/* confirm password */}
                        <input
                            type="password"
                            name="confirmPassword"
                            value={confirmPassword}
                            placeholder="Enter your password again"
                            autoComplete="new-password"
                            minLength={12}
                            maxLength={128}
                            required
                            onChange={handleConfirmPasswordChange}
                        />
                    </div>

                    <button type="submit" disabled={isLoading}>Save</button>
                </form>
            </div>
        </div>
    );
};

export default Register;
