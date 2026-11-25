import React from "react";
import styles from "./styles.module.scss";
import Header from "../../components/header/Header";
import Dashboard from "../dashboard";
import { useAuth } from "../../utils/auth";

const Home = () => {
    const { user } = useAuth();

    return (
        <div className={styles.container}>
            <Header />
            <div className={styles.contentContainer}>
                <h4 className={styles.heading}>
                    <span>Welcome {user?.username}</span>
                </h4>
                <Dashboard />
            </div>
        </div>
    );
};

export default Home;
