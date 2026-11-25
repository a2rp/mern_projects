# 091 - Authentication end to end: Examples

This example connects a React sign-in screen to an Express API. The server hashes passwords, stores users in MongoDB, maintains sessions in MongoDB, issues CSRF tokens for state-changing requests, and protects the current-user endpoint.

This is a learning implementation. Before exposing authentication to real users, configure HTTPS, rate limits, account recovery, email verification, operational alerts, and the session and cookie policy for the actual deployment.

## 1. Install the server-side packages

The server package needs Express, Mongoose, Argon2, an Express session middleware, a MongoDB session store, CORS, and CSRF middleware. Choose versions compatible with the Node.js runtime you deploy. The client package uses React and Vite.

~~~~text
# server package dependencies
express
mongoose
argon2
express-session
connect-mongo
cors
csrf-sync
~~~~

## 2. Create a user model

~~~~js
// server/src/features/users/user.model.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member"
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
~~~~

## 3. Validate credentials, hash passwords, and authenticate

~~~~js
// server/src/features/auth/auth.service.js
import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { User } from "../users/user.model.js";

const dummyPasswordHash = await argon2.hash(
  randomBytes(32).toString("hex")
);

function makeError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeEmail(email) {
  if (typeof email !== "string") {
    throw makeError("Enter a valid email and password.", 400);
  }

  const normalized = email.trim().toLowerCase();

  if (normalized.length > 254 || !normalized.includes("@")) {
    throw makeError("Enter a valid email and password.", 400);
  }

  return normalized;
}

function validatePassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  ) {
    throw makeError(
      "Password must be between 12 and 128 characters.",
      400
    );
  }
}

function toPublicUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    role: user.role
  };
}

export async function register(input = {}) {
  const email = normalizeEmail(input.email);
  validatePassword(input.password);

  const passwordHash = await argon2.hash(input.password);

  try {
    const user = await User.create({
      email,
      passwordHash,
      role: "member"
    });

    return toPublicUser(user);
  } catch (error) {
    if (error?.code === 11000) {
      throw makeError("An account could not be created with those details.", 409);
    }

    throw error;
  }
}

export async function authenticate(input = {}) {
  const email = normalizeEmail(input.email);
  validatePassword(input.password);

  const user = await User.findOne({ email }).select("+passwordHash");
  const hashToVerify = user?.passwordHash ?? dummyPasswordHash;
  const passwordMatches = await argon2.verify(
    hashToVerify,
    input.password
  );

  if (!user || !passwordMatches) {
    throw makeError("Email or password is incorrect.", 401);
  }

  return toPublicUser(user);
}

export async function findPublicUserById(id) {
  const user = await User.findById(id).select("email role");
  return user ? toPublicUser(user) : null;
}
~~~~

The dummy hash makes the unknown-account path perform a password verification as well. The same generic login error prevents direct email disclosure; rate limiting is still required.

## 4. Configure Mongo-backed sessions

~~~~js
// server/src/config/session.js
import session from "express-session";
import MongoStore from "connect-mongo";

export function createSessionMiddleware(config) {
  return session({
    name: "app.sid",
    secret: config.sessionSecret,
    store: MongoStore.create({
      mongoUrl: config.mongoUri,
      collectionName: "sessions",
      ttl: 8 * 60 * 60
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60 * 1000
    }
  });
}
~~~~

Provide the session secret from protected server configuration. Use a high-entropy value and never commit it. The in-memory Express session store is for local development; this example uses MongoDB for session persistence.

~~~~text
# server/.env.example
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/mern_course
SESSION_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
~~~~

The actual server env file must remain ignored by Git. If the server runs behind a reverse proxy that terminates HTTPS, configure Express to trust only the correct proxy so Secure cookies work.

## 5. Rotate and destroy sessions

~~~~js
// server/src/features/auth/session-helpers.js
export function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

export function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

export function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}
~~~~

## 6. Create controllers and routes

~~~~js
// server/src/features/auth/auth.controller.js
import * as auth from "./auth.service.js";
import {
  destroySession,
  regenerateSession,
  saveSession
} from "./session-helpers.js";

export async function register(req, res, next) {
  try {
    const user = await auth.register(req.body);
    res.status(201).json({ data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const user = await auth.authenticate(req.body);

    // Replace the pre-login session identifier.
    await regenerateSession(req);
    req.session.userId = user.id;
    await saveSession(req);

    res.status(200).json({ data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function currentUser(req, res, next) {
  try {
    const user = await auth.findPublicUserById(req.session.userId);

    if (!user) {
      return res.status(401).json({
        error: { message: "Authentication is required." }
      });
    }

    res.status(200).json({ data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await destroySession(req);
    res.clearCookie("app.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
~~~~

~~~~js
// server/src/features/auth/require-auth.js
import { findPublicUserById } from "./auth.service.js";

export async function requireAuth(req, res, next) {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        error: { message: "Authentication is required." }
      });
    }

    const user = await findPublicUserById(userId);

    if (!user) {
      await new Promise((resolve) => {
        req.session.destroy(() => resolve());
      });

      return res.status(401).json({
        error: { message: "Authentication is required." }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
~~~~

~~~~js
// server/src/features/auth/auth.routes.js
import { Router } from "express";
import * as controller from "./auth.controller.js";
import { requireAuth } from "./require-auth.js";

export const authRouter = Router();

authRouter.post("/register", controller.register);
authRouter.post("/login", controller.login);
authRouter.get("/me", requireAuth, controller.currentUser);
authRouter.post("/logout", requireAuth, controller.logout);
~~~~

A protected route can add a role check after authentication:

~~~~js
function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({
        error: { message: "You do not have permission to do that." }
      });
    }

    next();
  };
}

app.get("/api/admin/reports", requireAuth, requireRole("admin"), getReports);
~~~~

## 7. Configure CORS, session middleware, and CSRF in order

~~~~js
// server/src/app.js
import express from "express";
import cors from "cors";
import { csrfSync } from "csrf-sync";
import { createSessionMiddleware } from "./config/session.js";
import { authRouter } from "./features/auth/auth.routes.js";

export function createApp(config) {
  const app = express();

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
      allowedHeaders: ["Content-Type", "X-CSRF-Token"]
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(createSessionMiddleware(config));

  const {
    generateToken,
    csrfSynchronisedProtection
  } = csrfSync();

  // Safe GET: it creates or returns a token tied to the session.
  app.get("/api/auth/csrf-token", (req, res) => {
    res.json({ csrfToken: generateToken(req) });
  });

  // This protects state-changing routes registered below.
  app.use(csrfSynchronisedProtection);
  app.use("/api/auth", authRouter);

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    const status = Number.isInteger(error.status) ? error.status : 500;
    const message =
      status < 500 ? error.message : "An unexpected server error occurred.";

    if (status >= 500) console.error(error);

    res.status(status).json({ error: { message } });
  });

  return app;
}
~~~~

Middleware order is significant: JSON parsing and session creation must happen before CSRF token generation and checks. The CSRF token is tied to the current session. Login regenerates the session, so the browser must request a new token after login.

Configure registration and login rate limiting before making these routes public. Keep HTTPS, session settings, and the allowed client origin aligned with the real deployment.

## 8. Start the API after configuration and database checks

~~~~js
// server/src/server.js
import mongoose from "mongoose";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;
const sessionSecret = process.env.SESSION_SECRET;
const clientOrigin =
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port.");
}
if (!mongoUri) throw new Error("MONGODB_URI is required.");
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters.");
}

await mongoose.connect(mongoUri);

const app = createApp({
  port,
  mongoUri,
  sessionSecret,
  clientOrigin,
  isProduction: process.env.NODE_ENV === "production"
});

app.listen(port, () => {
  console.log("API listening on port " + port);
});
~~~~

Generate a high-entropy session secret and keep it in protected server configuration. The example's length check is only a guard against an obviously short value; character count is not a substitute for randomness.

## 9. Build the React API client

~~~~text
# client/.env.development
VITE_API_BASE_URL=http://localhost:4000
~~~~

~~~~js
// client/src/features/auth/authApi.js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
let csrfToken = "";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(apiBaseUrl + path, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message ?? "The request failed.",
      response.status
    );
  }

  return payload;
}

export async function refreshCsrfToken() {
  const result = await apiRequest("/api/auth/csrf-token");
  csrfToken = result.csrfToken;
}

export async function register(input) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
    },
    body: JSON.stringify(input)
  });
}

export async function login(input) {
  const result = await apiRequest("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
    },
    body: JSON.stringify(input)
  });

  await refreshCsrfToken();
  return result;
}

export function getCurrentUser() {
  return apiRequest("/api/auth/me");
}

export async function logout() {
  await apiRequest("/api/auth/logout", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken }
  });

  csrfToken = "";
  await refreshCsrfToken();
}

export { ApiError };
~~~~

The browser stores and sends the HttpOnly session cookie; React never reads it. The client receives only a safe public user object.

## 10. Create a simple React authentication screen

~~~~jsx
// client/src/features/auth/AuthPage.jsx
import { useEffect, useState } from "react";
import {
  ApiError,
  getCurrentUser,
  login,
  logout,
  refreshCsrfToken,
  register
} from "./authApi.js";

export function AuthPage() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        await refreshCsrfToken();
        const result = await getCurrentUser();

        if (active) {
          setUser(result.data.user);
          setStatus("signed-in");
        }
      } catch (error) {
        if (!active) return;

        if (error instanceof ApiError && error.status === 401) {
          setUser(null);
          setStatus("signed-out");
        } else {
          setMessage(error.message);
          setStatus("error");
        }
      }
    }

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setStatus("submitting");

    try {
      if (mode === "register") {
        await register({ email, password });
        setMessage("Account created. You can now sign in.");
        setPassword("");
        setMode("login");
        setStatus("signed-out");
        return;
      }

      const result = await login({ email, password });
      setUser(result.data.user);
      setPassword("");
      setStatus("signed-in");
    } catch (error) {
      setMessage(error.message);
      setStatus("signed-out");
    }
  }

  async function signOut() {
    setMessage("");

    try {
      await logout();
      setUser(null);
      setStatus("signed-out");
      setMessage("You are signed out.");
    } catch (error) {
      setMessage(error.message);
      setStatus("error");
    }
  }

  if (status === "loading") {
    return <p>Checking your session…</p>;
  }

  if (user) {
    return (
      <main>
        <h1>Account</h1>
        <p>Signed in as {user.email}</p>
        <button type="button" onClick={signOut}>
          Sign out
        </button>
        {message && <p role="status">{message}</p>}
      </main>
    );
  }

  return (
    <main>
      <h1>{mode === "login" ? "Sign in" : "Create an account"}</h1>

      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={
            mode === "login" ? "current-password" : "new-password"
          }
          minLength={12}
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button disabled={status === "submitting"} type="submit">
          {status === "submitting"
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMessage("");
          setMode(mode === "login" ? "register" : "login");
        }}
      >
        {mode === "login"
          ? "Create an account"
          : "I already have an account"}
      </button>

      {message && <p role="alert">{message}</p>}
    </main>
  );
}
~~~~

The UI represents session loading, signed-out, signed-in, and error states. A client-side signed-in view improves navigation; the server still checks the session for each protected resource.

## 11. Walk through the flow manually

1. Start MongoDB, the Express API, and the React app.
2. Open the authentication screen; the client requests a CSRF token and current user.
3. Register with a valid email and password.
4. Sign in. Inspect the request and response in the browser Network panel.
5. Confirm the browser stores a session cookie that is HttpOnly.
6. Confirm login returns a public user object without a password hash.
7. Reload and verify the current-user request restores the session.
8. Sign out and confirm the session is destroyed and the cookie is cleared.
9. Call a protected route without a session and confirm the API returns 401.
10. Call a state-changing route without a CSRF token and confirm the server rejects it.
11. Try an authenticated action without the required role and confirm the API returns 403.

## Common mistakes

- Saving plaintext passwords or using a fast hash.
- Returning password hashes in API responses.
- Putting session IDs or bearer tokens in localStorage.
- Trusting a user ID or role sent by React.
- Failing to regenerate the session ID after login.
- Clearing only React state during logout.
- Using the Express in-memory session store in production.
- Returning different login errors for unknown accounts and wrong passwords.
- Forgetting rate limits on credential endpoints.
- Treating CORS or SameSite as a complete CSRF defense.
- Protecting a React page while leaving the API route public.
- Assuming authentication grants permission to every resource.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Next chapter |
| --- | --- | --- | --- |
| [090 - Build a CRUD feature across UI, API, and database](../lessons/090-build-a-crud-feature-across-ui-api-and-database.md) | [Lesson](../lessons/091-authentication-end-to-end.md) | [Q&A](../qnas/091-authentication-end-to-end.md) | [092 - File uploads end to end](../lessons/092-file-uploads-end-to-end.md) |
