# 091 - Authentication end to end

Authentication answers “who is making this request?” Authorization answers “what may that identity do?” A React page can collect credentials, but the Express API must verify them, create an authenticated session, and check that session on protected requests.

This chapter builds a session-based authentication flow for a MERN application. Passwords are stored as adaptive hashes, the browser receives only an opaque session cookie, and the server keeps session state in MongoDB. Cookie authentication also needs CSRF protection because browsers automatically attach cookies to matching requests.

## Learning outcomes

After this chapter, you should be able to:

- Distinguish authentication from authorization.
- Register users without storing plaintext passwords.
- Verify a login using a password-hashing library.
- Use an opaque session identifier backed by server-side session data.
- Regenerate the session after login and destroy it at logout.
- Protect API routes with authentication middleware.
- Return a generic login error and limit automated attempts.
- Include a CSRF token on cookie-authenticated state-changing requests.
- Keep session secrets and credentials out of browser code and version control.

## 1. Separate identity from permission

- **Authentication** verifies identity, such as comparing a submitted password with a stored password hash.
- **Session management** remembers successful authentication across later HTTP requests.
- **Authorization** checks whether the authenticated identity may perform a particular operation.

A valid session does not grant every permission. A regular member must not be able to access an administrator route just because the request is authenticated.

The browser can display a signed-in page, but every protected API route must verify the session on the server.

## 2. Use a server-side session for a browser app

This chapter uses the following flow:

1. The user submits an email and password.
2. The API verifies the password.
3. The server regenerates a session and stores the user identifier in it.
4. The browser receives an opaque session ID cookie.
5. Later requests send that cookie automatically.
6. Express loads the session and the API checks the user and permissions.

With Express session middleware, session data stays on the server; the browser cookie carries a signed session identifier. Do not put passwords, roles, or personal data inside the session cookie.

A session cookie is a good fit for a browser app. Other clients and identity providers may need a different approach. Do not choose JWTs merely because the application uses React and Express; token storage, refresh, revocation, and browser security still need deliberate design.

## 3. Hash passwords with an adaptive algorithm

Use a password-hashing algorithm designed to make guessing expensive. Argon2id is a modern choice when available. Its encoded hash includes the salt and parameters needed for verification.

Never store plaintext passwords, reversibly encrypt passwords, or use a fast general-purpose hash such as SHA-256 for password storage. Keep the password-hashing library current and benchmark its settings on the server.

~~~~js
// server/src/features/auth/passwords.js
import argon2 from "argon2";

export function hashPassword(password) {
  return argon2.hash(password);
}

export function verifyPassword(passwordHash, password) {
  return argon2.verify(passwordHash, password);
}
~~~~

Choose and document a password length policy. Never silently truncate a password, and cap the maximum request size to prevent excessive input.

## 4. Define a user model that hides the hash

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

The unique index is important for concurrent registrations, but the service still catches duplicate-key errors and returns a deliberate response. Never send the password hash to the browser.

## 5. Validate registration and login on the server

Client checks help a user fill in a form. They do not protect the API because callers can send HTTP requests directly.

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

The login response uses the same error for an unknown account and an incorrect password. The dummy hash avoids returning immediately without doing password verification when the account does not exist. Rate limits and monitoring are still needed to reduce automated guessing.

This sample returns 409 for a duplicate registration so the conflict is visible while learning. A public signup flow may use a generic response and email verification to avoid revealing whether an address is registered.

## 6. Store session state outside the browser

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

The Express in-memory session store is for local development only. Use an external compatible store for production and multiple server instances. The session secret must be unpredictable, kept on the server, and supplied through protected environment configuration.

Use HTTPS in production. When TLS ends at a reverse proxy, configure Express to trust only the actual trusted proxy path so secure cookies work correctly. Do not copy a broad trust-proxy setting without understanding the deployment.

These cookie settings are a baseline for a same-site browser deployment. A frontend and API on different sites may need different SameSite, CORS, and credential settings. Chapter 093 covers production cookies and deployment configuration in more depth.

## 7. Regenerate sessions at authentication boundaries

Regenerate the session after login so a pre-login session ID cannot be carried into authenticated state.

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

After regeneration, store only the authenticated user ID needed to look up the principal. Never trust a user ID or role sent by React.

## 8. Protect cookie-authenticated mutations from CSRF

Browsers attach cookies automatically. A malicious site may try to make a signed-in user's browser submit an unwanted state-changing request. SameSite cookies and CORS help, but they do not replace a CSRF defense.

A synchronizer token is stored in server-side session state, delivered to the legitimate client, then required on state-changing requests. The example uses the csrf-sync middleware interface:

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

  // This safe GET issues the token associated with this session.
  app.get("/api/auth/csrf-token", (req, res) => {
    res.json({ csrfToken: generateToken(req) });
  });

  // Register protection before the state-changing authentication routes.
  app.use(csrfSynchronisedProtection);
  app.use("/api/auth", authRouter);

  return app;
}
~~~~

The client sends the token in the <code>X-CSRF-Token</code> header for registration, login, logout, and other state-changing requests. After login regenerates the session, fetch a fresh token for the new session.

Never accept a CSRF token from the cookie alone as proof of user intent. Keep GET, HEAD, and OPTIONS free of state changes.

## 9. Implement registration, login, current-user, and logout endpoints

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

Keep registration and login rate-limited. Log authentication outcomes without logging passwords, cookies, tokens, or password hashes. Production account flows may also need email verification, recovery, MFA, and session revocation.

## 10. Require authentication and check permissions

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

Authorization can be a separate route middleware:

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

Use 401 when valid authentication is missing and 403 when an authenticated user lacks permission. Derive the user from the verified server session, then apply permissions for the specific resource and action.

## 11. Connect the React client with cookies and CSRF

For a cross-origin API that uses cookies, Fetch must include credentials. The server must allow the exact client origin and credentials, and browser cookie policy must permit the deployment.

~~~~js
// client/src/lib/auth-api.js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
let csrfToken = "";

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
    throw new Error(payload?.error?.message ?? "The request failed.");
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

  // Login rotated the server session, so get a token for the new session.
  await refreshCsrfToken();
  return result;
}

export async function getCurrentUser() {
  return apiRequest("/api/auth/me");
}

export async function logout() {
  await apiRequest("/api/auth/logout", {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken }
  });
  csrfToken = "";
}
~~~~

The frontend never reads the HttpOnly session cookie. The browser stores and sends it, while React gets a safe public user representation from <code>/api/auth/me</code>. Refresh a CSRF token before the first state-changing call and again after a session rotation.

A client-side route guard improves navigation but is not an access-control boundary. Protected API routes still require authentication and authorization.

## 12. Expire and revoke sessions

Logout must invalidate the server-side session and expire the browser cookie. Clearing only React state leaves the server session valid. Clearing only the browser cookie leaves a copied session identifier usable until the server revokes it or it expires.

Set an idle or absolute session lifetime appropriate to the application. Password changes, account recovery, role changes, and suspected compromise may require revoking active sessions. Do not rely on closing the browser to invalidate an authenticated session.

## 13. Production checklist

- Serve authentication over HTTPS.
- Keep session secrets and database credentials in protected server configuration.
- Use an external session store; do not use the Express in-memory store in production.
- Set the session cookie HttpOnly, Secure, and to an intentional SameSite policy.
- Configure proxy trust only for the real trusted proxy path.
- Allow only intended frontend origins and enable credentialed CORS deliberately.
- Require CSRF tokens on cookie-authenticated state-changing requests.
- Rate-limit registration, login, recovery, and other sensitive endpoints.
- Use generic authentication errors and avoid logging credentials or tokens.
- Store passwords using a current adaptive password-hashing implementation.
- Enforce authorization on every protected server route.
- Plan password reset, email verification, MFA, account recovery, session revocation, and audit events before production use.

## Common mistakes

- Saving plaintext passwords or using a fast hash.
- Returning a password hash in an API response.
- Storing a session ID or bearer token in localStorage.
- Trusting a user ID, role, or “signed in” flag sent by React.
- Failing to regenerate the session identifier after login.
- Clearing only client state during logout.
- Using the Express in-memory session store in production.
- Giving different login errors for an unknown email and a wrong password.
- Forgetting rate limits on credential endpoints.
- Treating CORS or SameSite as a complete CSRF defense.
- Protecting a React page but leaving its API route public.
- Assuming authentication alone grants permission to every resource.

## Chapter navigation

| Previous chapter | Chapter lesson | Chapter Q&A | Chapter example | Next chapter |
| --- | --- | --- | --- | --- |
| [090 - Build a CRUD feature across UI, API, and database](090-build-a-crud-feature-across-ui-api-and-database.md) | [Lesson](091-authentication-end-to-end.md) | [Q&A](../qnas/091-authentication-end-to-end.md) | [Example](../examples/091-authentication-end-to-end.md) | [092 - File uploads end to end](092-file-uploads-end-to-end.md) |
