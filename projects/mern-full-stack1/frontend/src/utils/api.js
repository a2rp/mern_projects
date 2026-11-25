import axios from "axios";

const apiOrigin = (process.env.REACT_APP_API_URL || "http://localhost:1198").replace(/\/+$/, "");
const api = axios.create({
    baseURL: `${apiOrigin}/api/v1`,
    withCredentials: true,
});

export default api;
