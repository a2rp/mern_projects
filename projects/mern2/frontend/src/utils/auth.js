import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        let active = true;
        api.get("/admin/verify")
            .then(({ data }) => {
                if (active && data.success) setAdmin(data.admin);
            })
            .catch(() => {
                if (active) setAdmin(null);
            })
            .finally(() => {
                if (active) setIsChecking(false);
            });
        return () => { active = false; };
    }, []);

    const login = useCallback((adminSession) => setAdmin(adminSession), []);
    const logout = useCallback(async () => {
        try {
            await api.post("/admin/logout");
        } catch {
            // Clear client state even when the API is unavailable.
        } finally {
            setAdmin(null);
        }
    }, []);
    const value = useMemo(() => ({ admin, isChecking, login, logout }), [admin, isChecking, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
