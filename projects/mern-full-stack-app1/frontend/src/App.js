import { Route, Routes, Navigate } from "react-router-dom";
import styles from "./styles.module.scss";
import { Suspense, lazy } from "react";
import loadingGIF from "./assets/images/loading-gif.gif";
import { AuthProvider } from "./utils/auth";
import RequireAuth from "./utils/RequireAuth";
import HasAuth from "./utils/HasAuth";

const Home = lazy(() => wait(0).then(() => import("./pages/home")));
const Login = lazy(() => wait(0).then(() => import("./pages/login")));
const Register = lazy(() => wait(0).then(() => import("./pages/register")));

function App() {
    return (
        <AuthProvider>
            <div className={styles.container}>
                <Suspense fallback={<img alt="Loading" src={loadingGIF} className={styles.fallback} />}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
                        <Route path="/register" element={<HasAuth><Register /></HasAuth>} />
                        <Route path="/login" element={<HasAuth><Login /></HasAuth>} />
                        <Route path="*" element={<Navigate to="/home" replace />} />
                    </Routes>
                </Suspense>
            </div>
        </AuthProvider>
    );
}

export default App;

const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));
