import { Navigate } from "react-router-dom";
import { useAuth } from "./auth";

const RequireAuth = ({ children }) => {
    const { admin, status } = useAuth();
    if (status === "checking") return <div role="status">Checking your session…</div>;
    return admin ? children : <Navigate to="/login" replace />;
};

export default RequireAuth;
