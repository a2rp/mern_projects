import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState("checking");

    useEffect(() => {
        let active = true;
        api.post("/user", {})
            .then(({ data }) => {
                if (!active) return;
                setUser(data.user);
                setStatus("authenticated");
            })
            .catch(() => {
                if (!active) return;
                setUser(null);
                setStatus("anonymous");
            });
        return () => { active = false; };
    }, []);

    const login = (userDetails) => {
        setUser(userDetails);
        setStatus("authenticated");
    };

    const logout = async () => {
        try {
            await api.post("/user/logout");
        } finally {
            setUser(null);
            setStatus("anonymous");
        }
    };

    return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
