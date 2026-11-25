import { Navigate } from "react-router-dom";
import { useAuth } from "./auth";

const HasAuth = ({ children }) => {
    const { admin, status } = useAuth();
    if (status === "checking") return <div role="status">Checking your session…</div>;
    return admin ? <Navigate to="/dashboard" replace /> : children;
};

export default HasAuth;
