import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [status, setStatus] = useState("checking");

    useEffect(() => {
        let active = true;
        api.post("/admin", {})
            .then(({ data }) => {
                if (!active) return;
                if (data.success && data.admin) {
                    setAdmin(data.admin);
                    setStatus("authenticated");
                } else setStatus("anonymous");
            })
            .catch(() => { if (active) setStatus("anonymous"); });
        return () => { active = false; };
    }, []);

    const login = useCallback((sessionAdmin) => {
        setAdmin(sessionAdmin);
        setStatus("authenticated");
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/admin/logout", {});
        } finally {
            setAdmin(null);
            setStatus("anonymous");
        }
    }, []);

    const value = useMemo(() => ({ admin, status, login, logout }), [admin, status, login, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
