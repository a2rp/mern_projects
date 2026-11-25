import { Navigate } from "react-router-dom";
import { useAuth } from "./auth";

const HasAuth = ({ children }) => {
    const { admin, isChecking } = useAuth();
    if (isChecking) return <p role="status">Checking your session…</p>;
    if (admin) return <Navigate to="/dashboard" replace />;
    return children;
};

export default HasAuth;
