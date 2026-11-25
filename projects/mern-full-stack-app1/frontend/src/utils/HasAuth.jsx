import { Navigate } from "react-router-dom";
import { useAuth } from "./auth";

const HasAuth = ({ children }) => {
    const { user, status } = useAuth();
    if (status === "checking") return <p role="status">Checking session...</p>;
    return user ? <Navigate to="/home" replace /> : children;
};

export default HasAuth;
