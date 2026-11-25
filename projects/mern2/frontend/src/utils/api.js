import axios from "axios";

const apiOrigin = (process.env.REACT_APP_API_URL || "http://localhost:1198").replace(/\/+$/, "");

const api = axios.create({
    baseURL: `${apiOrigin}/api/v1`,
    timeout: 12000,
    withCredentials: true,
    headers: { Accept: "application/json" },
});

export default api;
