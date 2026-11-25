# 079 - Authentication user experience: example

This example connects a React sign-in experience to an Express API that uses a server-managed session. The browser receives an HTTP-only session cookie; React asks the API for the current user and keeps only the public user profile in application state.

The UI route guard improves navigation. The Express middleware protects API routes. The server must also check authorization for each protected operation.

## What you will build

- A login form with labels, autocomplete hints, pending feedback, and a generic credential error.
- A shared authentication state that distinguishes loading, signed in, signed out, and session-check failure.
- Session restoration after a page reload.
- A React Router guard that remembers a safe in-app destination.
- Express endpoints for login, current-session lookup, and logout.
- Server-side session destruction and cookie clearing.
- A checklist for CSRF protection, session storage, rate limiting, and production deployment.

## Assumptions

This example assumes:

- React and React Router are installed in the client.
- Express and Mongoose are used by the API.
- A MongoDB User model has <code>email</code>, <code>displayName</code>, and <code>passwordHash</code> fields.
- <code>passwordHash</code> was created with a password-hashing algorithm such as bcrypt. Passwords are never stored in plaintext.
- The API and web app are same-origin in production, or cross-origin cookie and CORS settings are deliberately configured.
- CSRF protection for cookie-authenticated state-changing requests is configured before production.

## File structure

~~~text
client/
└── src/
    ├── api/
    │   └── auth.js
    ├── auth/
    │   ├── AuthContext.jsx
    │   └── RequireAuth.jsx
    ├── pages/
    │   └── LoginPage.jsx
    ├── App.jsx
    └── auth.css

server/
├── middleware/
│   └── requireAuth.js
├── routes/
│   └── authRoutes.js
└── app.js
~~~

## 1. Configure a server-side session

Install the session middleware and a production-capable session store in the API project. Connect Mongoose to MongoDB before accepting requests.

Create the session middleware in <code>server/app.js</code>:

~~~js
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  // Set this only when the app is behind the known HTTPS-terminating proxy.
  app.set("trust proxy", 1);
}

app.use(express.json());

app.use(
  session({
    name: isProduction ? "__Host-app.sid" : "app.sid",
    secret: process.env.SESSION_SECRET,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 8,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use("/api/auth", authRoutes);

export default app;
~~~

Set <code>SESSION_SECRET</code> to a high-entropy secret from the deployment environment. Do not commit it. The <code>__Host-</code> cookie prefix is used only in production here, where HTTPS is required; that prefix also requires <code>Secure</code>, <code>Path=/</code>, and no <code>Domain</code> attribute.

The session middleware’s in-memory default store is for development only. Use a shared production store, protect it, and configure idle and absolute session expiry. If TLS terminates at a proxy, configure Express to trust only the proxy topology you actually use so secure-cookie behavior is correct.

If the frontend and API have different origins, set <code>credentials: "include"</code> in browser requests and configure CORS with the exact trusted frontend origin and credentials enabled. Never combine credentialed CORS with a wildcard origin. Choose cookie and CSRF settings for the actual deployment.

## 2. Add the current-user middleware

Create <code>server/middleware/requireAuth.js</code>:

~~~js
export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      error: {
        code: "AUTH_REQUIRED",
        message: "Sign in to continue.",
      },
    });
  }

  next();
}
~~~

This middleware checks whether the session identifies a user. For resource mutations, add an authorization check too. For example, a course edit endpoint must verify that the signed-in user owns that course or has a role allowed to edit it. Never trust a role or owner id supplied by React.

## 3. Implement the authentication endpoints

Create <code>server/routes/authRoutes.js</code>:

~~~js
import { Router } from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

function publicUser(user) {
  return {
    id: String(user._id),
    displayName: user.displayName,
    email: user.email,
  };
}

router.post("/login", async (req, res, next) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password || password.length > 1024) {
      return res.status(400).json({
        error: {
          code: "INVALID_LOGIN_INPUT",
          message: "Enter your email and password.",
        },
      });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    const passwordMatches =
      user && (await bcrypt.compare(password, user.passwordHash));

    if (!passwordMatches) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Email or password is incorrect.",
        },
      });
    }

    // Replace the pre-authentication session identifier after login.
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        return next(regenerateError);
      }

      req.session.userId = String(user._id);

      req.session.save((saveError) => {
        if (saveError) {
          return next(saveError);
        }

        res.json({ user: publicUser(user) });
      });
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId).select(
      "_id displayName email"
    );

    if (!user) {
      return req.session.destroy((destroyError) => {
        if (destroyError) {
          return next(destroyError);
        }

        res.clearCookie(
          process.env.NODE_ENV === "production" ? "__Host-app.sid" : "app.sid",
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          }
        );

        res.status(401).json({
          error: {
            code: "AUTH_REQUIRED",
            message: "Sign in to continue.",
          },
        });
      });
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", requireAuth, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie(
      process.env.NODE_ENV === "production" ? "__Host-app.sid" : "app.sid",
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      }
    );

    res.status(204).end();
  });
});

export default router;
~~~

In a complete application, add rate limiting to login attempts, monitor suspicious activity without logging credentials, and use a generic response for rejected credentials. A production login handler may also compare a submitted password against a fixed dummy hash when the account is absent, to reduce response-time differences. Never return <code>passwordHash</code> or a raw session identifier.

The example regenerates the session id after successful authentication and destroys it on logout. The cookie is cleared with the same name and scope used to create it. Do not use the default in-memory session store in production.

## 4. Create the client API helpers

Create <code>client/src/api/auth.js</code>:

~~~js
async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(path, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      ...options,
    });
  } catch {
    throw new Error("We could not reach the server. Check your connection and try again.");
  }

  return response;
}

export async function getCurrentUser({ signal } = {}) {
  const response = await request("/api/auth/me", { signal });

  if (response.status === 401) {
    return null;
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error("We could not check your session. Try again.");
  }

  if (!payload.user) {
    throw new Error("The server returned an invalid session response.");
  }

  return payload.user;
}

export async function signIn(credentials) {
  const response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  const payload = await readJson(response);

  if (response.status === 401) {
    throw new Error("Email or password is incorrect.");
  }

  if (!response.ok) {
    throw new Error(
      payload.error?.message || "We could not sign you in. Try again."
    );
  }

  if (!payload.user) {
    throw new Error("The server did not return your account.");
  }

  return payload.user;
}

export async function signOut() {
  const response = await request("/api/auth/logout", { method: "POST" });

  if (!response.ok) {
    throw new Error("We could not sign you out. Try again.");
  }
}
~~~

The helper distinguishes a confirmed anonymous response from a server or network failure. It never reads the session cookie; the browser handles the HTTP-only cookie.

## 5. Share authentication state in React

Create <code>client/src/auth/AuthContext.jsx</code>:

~~~jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, signIn, signOut } from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    status: "loading",
    user: null,
    error: null,
  });
  const [checkVersion, setCheckVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setState({ status: "loading", user: null, error: null });

    getCurrentUser({ signal: controller.signal })
      .then((user) => {
        setState(
          user
            ? { status: "authenticated", user, error: null }
            : { status: "anonymous", user: null, error: null }
        );
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({
            status: "error",
            user: null,
            error: error.message,
          });
        }
      });

    return () => controller.abort();
  }, [checkVersion]);

  async function login(credentials) {
    const user = await signIn(credentials);
    setState({ status: "authenticated", user, error: null });
    return user;
  }

  async function logout() {
    // Keep the signed-in state if server-side invalidation fails.
    await signOut();
    setState({ status: "anonymous", user: null, error: null });
  }

  function retrySessionCheck() {
    setCheckVersion((version) => version + 1);
  }

  const value = useMemo(
    () => ({ ...state, login, logout, retrySessionCheck }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
~~~

The provider keeps only the safe profile returned by the API. Do not put the password or session identifier into React context, browser storage, analytics, or logs.

For an application where multiple components can receive independent 401 responses, centralize session-expiry handling in the API layer. Avoid having every component start its own redirect loop.

## 6. Guard protected routes

Create <code>client/src/auth/RequireAuth.jsx</code>:

~~~jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export function RequireAuth() {
  const { status, retrySessionCheck } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <p role="status">Checking your session…</p>;
  }

  if (status === "error") {
    return (
      <section aria-labelledby="session-error-title">
        <h1 id="session-error-title">Session check failed</h1>
        <p>We could not check your session. Your connection may be unavailable.</p>
        <button type="button" onClick={retrySessionCheck}>
          Try again
        </button>
      </section>
    );
  }

  if (status === "anonymous") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}

export function RequireAnonymous({ children }) {
  const { status } = useAuth();

  if (status === "loading") {
    return <p role="status">Checking your session…</p>;
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
~~~

Mount the provider above routes that use <code>useAuth</code>. With React Router, the route tree can look like this:

~~~jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { RequireAnonymous, RequireAuth } from "./auth/RequireAuth.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <RequireAnonymous>
                <LoginPage />
              </RequireAnonymous>
            }
          />

          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
~~~

The guard improves what the user sees. It does not protect <code>/api/dashboard</code> or any other endpoint. Apply server authentication and authorization to every protected API route.

## 7. Build the login page

Create <code>client/src/pages/LoginPage.jsx</code>:

~~~jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

function safeReturnPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  try {
    const destination = new URL(value, window.location.origin);

    if (destination.origin !== window.location.origin) {
      return "/dashboard";
    }

    return destination.pathname + destination.search + destination.hash;
  } catch {
    return "/dashboard";
  }
}

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    const form = event.currentTarget;
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(form);
    const credentials = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    };

    try {
      await login(credentials);
      form.reset();
      navigate(safeReturnPath(location.state?.from), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">Sign in</h1>
        <p>Enter your account details to continue.</p>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
~~~

A rejected login keeps the email and lets the browser clear the password because it is an uncontrolled field. If the form adds a password-visibility toggle, make it a non-submit button and test that toggling does not clear the entered value.

The rejected-credentials and network messages are form-level errors, so the example does not mark the email field invalid. If the API later returns a safe field-specific error, associate that message with its input and set <code>aria-invalid</code> only for that field.

## 8. Add a logout control

Render a logout button in an authenticated header:

~~~jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";

export function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setError("");
    setIsSigningOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header>
      <p>Signed in as {user.displayName}</p>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={handleLogout} disabled={isSigningOut}>
        {isSigningOut ? "Signing out…" : "Sign out"}
      </button>
    </header>
  );
}
~~~

If the API cannot invalidate the server session, do not claim logout succeeded. Keep the user informed and offer a retry. The API should use a CSRF defense for this cookie-authenticated POST.

## 9. Add basic styles

Create <code>client/src/auth.css</code>:

~~~css
.auth-page {
  box-sizing: border-box;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  background: #f4f6f8;
  color: #18212f;
  font-family: system-ui, sans-serif;
}

.auth-card {
  box-sizing: border-box;
  width: min(100%, 28rem);
  padding: 2rem;
  border: 1px solid #cbd3dd;
  border-radius: 0.75rem;
  background: #fff;
  box-shadow: 0 0.75rem 2rem rgb(18 32 52 / 10%);
}

.auth-card form {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.auth-card input,
.auth-card button {
  box-sizing: border-box;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid #8290a3;
  border-radius: 0.35rem;
  font: inherit;
}

.auth-card input:focus-visible,
.auth-card button:focus-visible {
  outline: 3px solid #155eef;
  outline-offset: 2px;
}

.auth-card button {
  margin-top: 0.75rem;
  border-color: #155eef;
  background: #155eef;
  color: #fff;
  cursor: pointer;
}

.auth-card button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.auth-error {
  padding: 0.75rem;
  border-left: 0.25rem solid #b42318;
  background: #fef3f2;
  color: #7a271a;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 32rem) {
  .auth-card {
    padding: 1.25rem;
  }
}
~~~

Import <code>auth.css</code> from your app entry point. If the project already has global reset rules, keep those global styles in one place and remove duplicated global declarations here.

## 10. Add CSRF and production protections

This example uses cookie-based authentication, so state-changing requests need a CSRF strategy appropriate to the deployment. Add a maintained CSRF token middleware or another reviewed strategy, and verify request origins where appropriate. SameSite cookies help but are not a complete replacement for CSRF defenses.

Also add:

- A login rate limit and monitoring for repeated failures.
- A server-side password hash using a suitable password-hashing algorithm.
- A shared production session store with limited access and secure backups.
- HTTPS across the complete session.
- A strong session secret provided through deployment configuration.
- Narrow CORS settings if the UI and API are on different origins.
- Authorization checks on each protected route, including ownership checks.
- Safe error handling that never returns stack traces or internal database details.
- Session expiry and revocation behavior for password changes and account recovery.
- Logs that omit passwords, cookies, session ids, and access tokens.

The example intentionally does not include account registration or password recovery. Those flows need their own rate limits, verification steps, generic responses, and secure, time-limited recovery tokens.

## 11. Try the flow

1. Open <code>/dashboard</code> while signed out. The app should show the session check, then send you to sign in.
2. Enter an invalid email syntax. The browser should identify the invalid field.
3. Submit an unknown email or incorrect password. The page should show the same generic credentials message and keep the email.
4. Stop the API and reload. The app should show a session-check error and retry control, not claim the user is signed out.
5. Sign in with a valid account. The server should regenerate the session identifier, and the app should go to the safe intended path.
6. Reload the page. The app should call <code>/api/auth/me</code> and restore the user without asking for the password again.
7. Sign out. The API should destroy the server-side session and clear the cookie; a later session check should return anonymous.
8. Try calling a protected API endpoint without a session. It should return an unauthenticated response.
9. Sign in as a user without a specific permission and call a protected operation. The server should deny it while preserving the signed-in session.
10. Test the flow using keyboard navigation and a screen reader. Confirm that labels, pending feedback, errors, and button states are understandable.

## Key takeaways

- Authentication confirms identity; authorization checks permission.
- The UI needs distinct loading, authenticated, anonymous, and error states.
- An HTTP-only cookie keeps the session identifier out of browser JavaScript.
- A React route guard improves the interface but does not protect the API.
- The server invalidates the session on logout and checks permission for each operation.
- Generic login errors reduce account enumeration.
- Safe redirects must remain inside the app.
- Cookie-authenticated mutations need an appropriate CSRF strategy.
- Do not store or log passwords, session identifiers, or authentication tokens.

## Chapter navigation

| Previous chapter | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- |
| [078 - Client-side form validation and user experience](../lessons/078-client-side-form-validation-and-user-experience.md) | [Lesson](../lessons/079-authentication-user-experience.md) | [Q&A](../qnas/079-authentication-user-experience.md) | [080 - Accessible forms, navigation, and components](../lessons/080-accessible-forms-navigation-and-components.md) |